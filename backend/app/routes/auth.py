from datetime import UTC, datetime, timedelta
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.password_reset import PasswordResetCode
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    PasswordResetCodeRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.config.settings import settings
from app.services.auth_service import create_access_token, get_current_user, hash_password, password_hash_needs_update, sync_admin_flag, verify_password
from app.services.email_service import send_password_reset_link
from app.services.password_reset_service import PasswordResetError, confirm_password_reset

router = APIRouter(tags=["auth"])
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = UserRepository.get_by_email(db, payload.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(email=payload.email.strip(), password_hash=hash_password(payload.password))
    sync_admin_flag(user)
    db.add(user)
    db.commit()
    db.refresh(user)
    sync_admin_flag(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    was_admin = user.is_admin
    sync_admin_flag(user)
    should_commit = user.is_admin != was_admin

    if password_hash_needs_update(user.password_hash):
        user.password_hash = hash_password(payload.password)
        should_commit = True

    if should_commit:
        db.commit()

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


RESET_CODE_EXPIRY_MINUTES = 15
RESET_LINK_EXPIRY_MINUTES = 15


@router.post("/reset-password/request")
def request_password_reset(payload: PasswordResetCodeRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    token = secrets.token_urlsafe(32)
    now = datetime.now(UTC).replace(tzinfo=None)
    frontend_url = settings.frontend_url.rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={token}"

    db.query(PasswordResetCode).filter(
        PasswordResetCode.user_id == user.id,
        PasswordResetCode.used_at.is_(None),
    ).delete(synchronize_session=False)

    reset_code = PasswordResetCode(
        user_id=user.id,
        code_hash=hash_password(token),
        expires_at=now + timedelta(minutes=RESET_LINK_EXPIRY_MINUTES),
    )
    db.add(reset_code)
    db.commit()

    try:
        send_password_reset_link(user.email, reset_link)
    except Exception as exc:
        logger.warning("Unable to send password reset link by email; returning manual link", exc_info=True)
        return {
            "success": True,
            "message": f"Email delivery is not configured. Use the reset link shown below. ({exc})",
            "delivery": "manual",
            "reset_link": reset_link,
        }

    return {
        "success": True,
        "message": "Password reset link sent to your email",
        "delivery": "email",
        "reset_link": reset_link,
    }


@router.post("/reset-password")
@router.post("/reset-password/confirm")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        confirm_password_reset(db, payload.token, payload.new_password)
    except PasswordResetError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    return {"success": True, "message": "Password updated successfully"}


@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=ProfileResponse)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.email != current_user.email:
        existing_user = UserRepository.get_by_email(db, payload.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

        current_user.email = payload.email.strip().lower()
        sync_admin_flag(current_user)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered") from exc

        db.refresh(current_user)

    return current_user


@router.patch("/profile/password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from the current password")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"success": True, "message": "Password updated successfully"}
