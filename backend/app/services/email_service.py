import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.config.settings import settings

logger = logging.getLogger(__name__)

PLACEHOLDER_VALUES = {
    "your-gmail-address@gmail.com",
    "your-16-character-google-app-password",
}


def _clean_env_value(value: str | None) -> str:
    return (value or "").strip()


def _clean_app_password(value: str | None) -> str:
    # Google displays app passwords in groups. SMTP expects the password without spaces.
    return _clean_env_value(value).replace(" ", "")


def send_password_reset_link(email: str, reset_link: str) -> None:
    smtp_username = _clean_env_value(settings.smtp_username)
    smtp_password = _clean_app_password(settings.smtp_password)
    from_email = _clean_env_value(settings.smtp_from_email) or smtp_username
    if (not smtp_username or smtp_username in PLACEHOLDER_VALUES) and from_email not in PLACEHOLDER_VALUES:
        smtp_username = from_email

    if not smtp_username or smtp_username in PLACEHOLDER_VALUES:
        raise RuntimeError("Set SMTP_USERNAME in backend/.env to the Gmail account that sends reset codes")
    if not smtp_password or smtp_password in PLACEHOLDER_VALUES:
        raise RuntimeError("Set SMTP_PASSWORD in backend/.env to a valid 16-character Google App Password")
    if not from_email or from_email in PLACEHOLDER_VALUES:
        raise RuntimeError("Set SMTP_FROM_EMAIL in backend/.env to the Gmail account that sends reset codes")

    subject = "Reset your CineVerse password"
    body = (
        "Hi,\n\n"
        "We received a request to reset the password for your CineVerse account.\n\n"
        f"Click this link to choose a new password:\n{reset_link}\n\n"
        "This link expires in 15 minutes and can only be used once.\n\n"
        "If you did not request this, you can ignore this email.\n\n"
        "CineVerse"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(("CineVerse", from_email))
    message["To"] = email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login(smtp_username, smtp_password)
        smtp.send_message(message)
