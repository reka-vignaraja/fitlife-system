import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_otp_email(to_email: str, otp: str):
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        raise Exception("SMTP email or password is not configured")

    message = EmailMessage()
    message["Subject"] = "FitLife Email Verification OTP"
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_EMAIL}>"
    message["To"] = to_email

    message.set_content(
        f"""
Hello,

Your FitLife email verification OTP is:

{otp}

This OTP will expire in {settings.OTP_EXPIRE_MINUTES} minutes.

If you did not request this, please ignore this email.

Thank you,
FitLife Team
"""
    )

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.send_message(message)