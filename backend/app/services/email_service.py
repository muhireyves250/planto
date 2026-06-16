"""
Async email sender using aiosmtplib.
Renders Jinja2 templates and sends via SMTP (Gmail port 587 STARTTLS or port 465 SSL).
Call any send_* function in a background task — all are async and non-blocking.
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

APP_URL = "https://planto.app"


def _smtp_ready() -> bool:
    """Return True when SMTP credentials are present."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            "SMTP not configured (SMTP_USER or SMTP_PASSWORD missing) — email skipped. "
            "Set these env vars on your deployment server."
        )
        return False
    return True


async def _send(msg: MIMEMultipart) -> None:
    """Send a pre-built MIME message, trying STARTTLS (587) then SSL (465)."""
    port = settings.SMTP_PORT

    # Try the configured port first
    try:
        use_tls = port == 465
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=port,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=use_tls,
            start_tls=not use_tls,
            timeout=20,
        )
        return
    except Exception as primary_err:
        logger.warning("Primary SMTP send failed (port %d): %s — trying fallback", port, primary_err)

    # Fallback: if 587 failed try 465, and vice-versa
    fallback_port = 465 if port != 465 else 587
    use_tls_fb = fallback_port == 465
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=fallback_port,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        use_tls=use_tls_fb,
        start_tls=not use_tls_fb,
        timeout=20,
    )


async def send_alert_email(
    to_email: str,
    title: str,
    message: str,
    alert_type: str = "info",
    crop_name: str = "",
    farm_name: str = "",
    action_url: str = "/",
) -> None:
    if not _smtp_ready():
        return
    try:
        html = _jinja_env.get_template("alert.html").render(
            title=title, message=message, alert_type=alert_type,
            crop_name=crop_name, farm_name=farm_name, action_url=action_url, app_url=APP_URL,
        )
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[{alert_type.upper()}] {title}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))
        await _send(msg)
        logger.info("Alert email sent to %s: %s", to_email, title)
    except Exception as e:
        logger.error("Failed to send alert email to %s: %s", to_email, e)


async def send_report_email(to_email: str, full_name: str, report_data: dict) -> None:
    if not _smtp_ready():
        return
    try:
        html = _jinja_env.get_template("weekly_report.html").render(**report_data, full_name=full_name, app_url=APP_URL)
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Weekly Farm Report — {report_data.get('report_date', '')}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))
        await _send(msg)
        logger.info("Weekly report sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send weekly report to %s: %s", to_email, e)


async def send_agronomist_digest_email(to_email: str, full_name: str, farms: list, report_date: str) -> None:
    if not _smtp_ready():
        return
    try:
        html = _jinja_env.get_template("agronomist_digest.html").render(
            full_name=full_name, farms=farms, report_date=report_date, app_url=APP_URL,
        )
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Farm Portfolio Digest — {report_date}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))
        await _send(msg)
        logger.info("Agronomist digest sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send agronomist digest to %s: %s", to_email, e)


async def send_otp_email(to_email: str, full_name: str, otp: str) -> None:
    if not _smtp_ready():
        # Still print OTP to server logs so admins can retrieve it during testing
        logger.warning("SMTP not configured — OTP for %s is: %s", to_email, otp)
        return
    try:
        html = _jinja_env.get_template("otp.html").render(
            full_name=full_name or to_email.split("@")[0], otp=otp,
        )
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Planto Verification Code"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))
        await _send(msg)
        logger.info("OTP email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s — OTP was: %s", to_email, e, otp)


async def send_soil_test_email(
    to_email: str,
    full_name: str,
    crop_name: str,
    farm_name: str,
    growth_stage: str,
    health_score: float,
    health_status: str,
    n: float,
    p: float,
    k: float,
    ph: float,
    moisture: float,
    temperature: float,
    fertilizer_recs: list,
    is_agronomist: bool = False,
) -> None:
    """Send soil test result email to farmer or agronomist."""
    if not _smtp_ready():
        return

    from datetime import date

    health_score_pct = round(health_score * 100) if health_score <= 1 else round(health_score)
    if health_score_pct >= 70:
        health_color = "green"
    elif health_score_pct >= 40:
        health_color = "amber"
    else:
        health_color = "red"

    try:
        template = _jinja_env.get_template("soil_test_result.html")
        html = template.render(
            full_name=full_name,
            crop_name=crop_name.capitalize(),
            farm_name=farm_name,
            growth_stage=growth_stage,
            health_score=health_score_pct,
            health_status=health_status,
            health_color=health_color,
            n=round(n, 1),
            p=round(p, 1),
            k=round(k, 1),
            ph=round(ph, 2),
            moisture=round(moisture, 1),
            temperature=round(temperature, 1),
            fertilizer_recs=fertilizer_recs,
            is_agronomist=is_agronomist,
            test_date=date.today().strftime("%B %d, %Y"),
            app_url=APP_URL,
        )

        subject = (
            f"[{crop_name.capitalize()}] Soil Test Results — {farm_name}"
            if is_agronomist
            else f"Soil Test Results for {crop_name.capitalize()}"
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await _send(msg)
        logger.info("Soil test email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send soil test email to %s: %s", to_email, e)
