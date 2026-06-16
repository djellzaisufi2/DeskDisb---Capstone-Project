import hashlib
import hmac
import smtplib
import ssl
import secrets
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone

from app.config import settings


def generate_temporary_password(length: int = 8) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def token_matches(token: str, token_hash: str | None) -> bool:
    return bool(token_hash) and hmac.compare_digest(hash_token(token), token_hash)


def reset_token_expiry(hours: int = 24) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def build_reset_link(token: str) -> str:
    base_url = (settings.frontend_base_url or "http://127.0.0.1:3000").rstrip("/")
    return f"{base_url}/reset-password?token={token}"


def send_email(to_email: str, subject: str, body: str) -> None:
    host = settings.smtp_host
    if not host:
        print(f"[mail:simulate] to={to_email} subject={subject}\n{body}")
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from_email or settings.smtp_username or "no-reply@localhost"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP(host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls(context=context)
        if settings.smtp_username:
            server.login(settings.smtp_username, settings.smtp_password or "")
        server.send_message(message)
