from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models.password_reset import PasswordResetCode
from app.models.user import User
from app.services.auth_service import hash_password, verify_password


class PasswordResetError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _utc_now_without_timezone() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def confirm_password_reset(db: Session, token: str, new_password: str) -> None:
    reset_token = token.strip()
    if not reset_token:
        raise PasswordResetError("Reset token is required")

    now = _utc_now_without_timezone()
    active_resets = (
        db.query(PasswordResetCode)
        .filter(PasswordResetCode.used_at.is_(None))
        .order_by(PasswordResetCode.created_at.desc())
        .all()
    )

    expired_match = None
    matching_reset = None
    for candidate in active_resets:
        if not verify_password(reset_token, candidate.code_hash):
            continue

        if candidate.expires_at <= now:
            expired_match = candidate
            break

        matching_reset = candidate
        break

    if expired_match:
        expired_match.used_at = now
        db.commit()
        raise PasswordResetError("Reset link has expired. Request a new password reset link.")

    if not matching_reset:
        raise PasswordResetError("Invalid reset link. Request a new password reset link.")

    user = db.query(User).filter(User.id == matching_reset.user_id).first()
    if not user:
        matching_reset.used_at = now
        db.commit()
        raise PasswordResetError("User not found", status_code=404)

    user.password_hash = hash_password(new_password)
    matching_reset.used_at = now
    db.commit()
