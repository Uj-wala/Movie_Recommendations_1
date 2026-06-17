from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.config.settings import settings
from app.repositories.user_repository import UserRepository

ALGORITHM = "HS256"
ADMIN_EMAIL = "Admin@gmail.com"
auth_scheme = HTTPBearer(auto_error=False)
optional_auth_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(subject: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.backend_secret_key, algorithm=ALGORITHM)


def _decode_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.backend_secret_key, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Missing subject")
        return int(user_id)
    except (ExpiredSignatureError, JWTError, ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized") from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    parsed_user_id = _decode_user_id(credentials.credentials)
    user = UserRepository.get_by_id(db, parsed_user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(optional_auth_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None

    try:
        parsed_user_id = _decode_user_id(credentials.credentials)
    except HTTPException:
        return None

    user = UserRepository.get_by_id(db, parsed_user_id)
    return user


def is_admin_email(email: str) -> bool:
    return email.casefold() == ADMIN_EMAIL.casefold()


def sync_admin_flag(user: User) -> User:
    user.is_admin = bool(user.is_admin or is_admin_email(user.email))
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
