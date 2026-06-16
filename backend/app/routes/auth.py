from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import create_access_token, get_current_user, hash_password, is_admin_email, sync_admin_flag, verify_password

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    sync_admin_flag(user)
    db.add(user)
    db.commit()
    db.refresh(user)
    sync_admin_flag(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    sync_admin_flag(user)
    db.commit()
    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = UserRepository.get_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.commit()

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

        current_user.email = payload.email
        current_user.is_admin = is_admin_email(payload.email)
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
