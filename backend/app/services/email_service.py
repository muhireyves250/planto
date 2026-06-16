"""
Async email sender using aiosmtplib.
Renders the alert.html Jinja2 template and sends via SMTP.
Call send_alert_email() in a background task — it is async and non-blocking.
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

logger = logging.getLogger(__name__)

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=True)

APP_URL = "https://planto.app"   # change to your production URL or add to settings


async def send_alert_email(
    to_email: str,
    title: str,
    message: str,
    alert_type: str = "info",
    crop_name: str = "",
    farm_name: str = "",
    action_url: str = "/",
) -> None:
    """Send an HTML alert email. Safe to call even if SMTP is not configured — logs and returns."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("SMTP not configured — skipping email to %s", to_email)
        return

    try:
        template = _jinja_env.get_template("alert.html")
        html = template.render(
            title=title,
            message=message,
            alert_type=alert_type,
            crop_name=crop_name,
            farm_name=farm_name,
            action_url=action_url,
            app_url=APP_URL,
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{alert_type.upper()}] {title}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            timeout=15,
        )
        logger.info("Alert email sent to %s: %s", to_email, title)
    except Exception as e:
        logger.warning("Failed to send alert email to %s: %s", to_email, e)


async def send_report_email(to_email: str, full_name: str, report_data: dict) -> None:
    """Send the weekly farm report HTML email to a farmer."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("SMTP not configured — skipping report email to %s", to_email)
        return

    try:
        template = _jinja_env.get_template("weekly_report.html")
        html = template.render(full_name=full_name, app_url=APP_URL, **report_data)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Weekly Farm Report — {report_data.get('report_date', '')}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            timeout=15,
        )
        logger.info("Weekly report sent to %s", to_email)
    except Exception as e:
        logger.warning("Failed to send weekly report to %s: %s", to_email, e)


async def send_agronomist_digest_email(
    to_email: str,
    full_name: str,
    farms: list,
    report_date: str,
) -> None:
    """Send the agronomist portfolio digest email."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("SMTP not configured — skipping digest email to %s", to_email)
        return

    try:
        template = _jinja_env.get_template("agronomist_digest.html")
        html = template.render(
            full_name=full_name,
            farms=farms,
            report_date=report_date,
            app_url=APP_URL,
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Farm Portfolio Digest — {report_date}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            timeout=15,
        )
        logger.info("Agronomist digest sent to %s", to_email)
    except Exception as e:
        logger.warning("Failed to send agronomist digest to %s: %s", to_email, e)
