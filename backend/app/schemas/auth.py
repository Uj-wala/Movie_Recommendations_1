import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_rules(password: str) -> str:
    if len(password) < 8 or len(password) > 128:
        raise ValueError("Password must be between 8 and 128 characters")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must include at least one letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must include at least one number")
    return password


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_rules(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_rules(value)


class ProfileUpdateRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_rules(value)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class ProfileResponse(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime | None = None

    class Config:
        from_attributes = True
