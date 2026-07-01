import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

logger = logging.getLogger("movie_backend")


def _validation_errors(exc) -> dict[str, str]:
    errors: dict[str, str] = {}
    for item in exc.errors():
        location = item.get("loc", [])
        field = next((part for part in reversed(location) if isinstance(part, str) and part != "query"), "detail")
        if field == "title":
            field = "keyword"
        message = item.get("msg", "Invalid value")
        if field in {"title", "keyword"} and "required" in message.lower():
            message = "Keyword is required"
        if field in {"title", "keyword"} and "ensure this value has at least 1 characters" in message.lower():
            message = "Keyword is required"
        if field in {"title", "keyword"} and (
            "ensure this value has at most 255 characters" in message.lower()
            or "string should have at most 255 characters" in message.lower()
        ):
            message = "Keyword must be 255 characters or fewer"
        errors[field] = message.replace("Value error, ", "")
    return errors


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        logger.info("Validation error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Invalid request",
                "errors": _validation_errors(exc),
            },
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(_: Request, exc: ValidationError):
        logger.info("Pydantic validation error: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Invalid request",
                "errors": _validation_errors(exc),
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        logger.info("HTTP error %s: %s", exc.status_code, exc.detail)
        message = exc.detail if isinstance(exc.detail, str) else "Error"
        payload = {"success": False, "message": message}
        if isinstance(exc.detail, dict):
            payload["message"] = "Invalid request"
            payload["errors"] = exc.detail
        if exc.status_code == status.HTTP_401_UNAUTHORIZED and payload["message"] in {"Error", "Unauthorized"}:
            payload["message"] = "Unauthorized"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            payload["message"] = "Forbidden"
        elif exc.status_code == status.HTTP_404_NOT_FOUND and payload["message"] == "Error":
            payload["message"] = "Resource not found"
        elif exc.status_code == status.HTTP_409_CONFLICT and payload["message"] == "Error":
            payload["message"] = "Conflict detected"
        return JSONResponse(status_code=exc.status_code, content=payload)

    @app.exception_handler(IntegrityError)
    async def integrity_handler(_: Request, exc: IntegrityError):
        logger.exception("Integrity error")
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"success": False, "message": "Conflict detected"},
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_handler(_: Request, exc: SQLAlchemyError):
        logger.exception("Database error")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )

    @app.exception_handler(Exception)
    async def fallback_handler(_: Request, exc: Exception):
        logger.exception("Unhandled server error")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "message": "Internal server error"},
        )
