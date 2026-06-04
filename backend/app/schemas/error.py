from pydantic import BaseModel


class ErrorResponse(BaseModel):
    success: bool = False
    message: str


class ValidationErrorResponse(ErrorResponse):
    errors: dict[str, str] | None = None
