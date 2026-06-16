"""
Async email sender using the Resend API (HTTPS — works on all cloud hosts).
Falls back to Gmail SMTP when RESEND_API_KEY is not set (local dev).
"""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

import aiosmtplib
import httpx
from jinja2 import Environment, FileSystemLoader

from app.core.config import settings

logger = logging.getLogger(__name__)

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=True)

APP_URL = "https://planto.app"
_RESEND_FROM = f"{settings.SMTP_FROM_NAME} <onboarding@resend.dev>"


async def _send(to_email: str, subject: str, html: str) -> None:
    """Send email via Resend API (preferred) or fall back to SMTP for local dev."""
    if settings.RESEND_API_KEY:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={"from": _RESEND_FROM, "to": [to_email], "subject": subject, "html": html},
            )
            resp.raise_for_status()
        return

    # Local dev fallback: Gmail SMTP
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("No RESEND_API_KEY and no SMTP credentials — email skipped.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    port = settings.SMTP_PORT
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=port,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=(port == 465),
            start_tls=(port != 465),
            timeout=20,
        )
        return
    except Exception as primary_err:
        logger.warning("Primary SMTP send failed (port %d): %s — trying fallback", port, primary_err)

    fallback_port = 465 if port != 465 else 587
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=fallback_port,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        use_tls=(fallback_port == 465),
        start_tls=(fallback_port != 465),
        timeout=20,
    )


async def send_otp_email(to_email: str, full_name: str, otp: str) -> None:
    try:
        html = _jinja_env.get_template("otp.html").render(
            full_name=full_name or to_email.split("@")[0], otp=otp,
        )
        await _send(to_email, "Your Planto Verification Code", html)
        logger.info("OTP email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send OTP email to %s: %s — OTP was: %s", to_email, e, otp)


async def send_alert_email(
    to_email: str,
    title: str,
    message: str,
    alert_type: str = "info",
    crop_name: str = "",
    farm_name: str = "",
    action_url: str = "/",
) -> None:
    try:
        html = _jinja_env.get_template("alert.html").render(
            title=title, message=message, alert_type=alert_type,
            crop_name=crop_name, farm_name=farm_name, action_url=action_url, app_url=APP_URL,
        )
        await _send(to_email, f"[{alert_type.upper()}] {title}", html)
        logger.info("Alert email sent to %s: %s", to_email, title)
    except Exception as e:
        logger.error("Failed to send alert email to %s: %s", to_email, e)


async def send_report_email(to_email: str, full_name: str, report_data: dict) -> None:
    try:
        html = _jinja_env.get_template("weekly_report.html").render(
            **report_data, full_name=full_name, app_url=APP_URL,
        )
        await _send(to_email, f"Your Weekly Farm Report — {report_data.get('report_date', '')}", html)
        logger.info("Weekly report sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send weekly report to %s: %s", to_email, e)


async def send_agronomist_digest_email(to_email: str, full_name: str, farms: list, report_date: str) -> None:
    try:
        html = _jinja_env.get_template("agronomist_digest.html").render(
            full_name=full_name, farms=farms, report_date=report_date, app_url=APP_URL,
        )
        await _send(to_email, f"Your Farm Portfolio Digest — {report_date}", html)
        logger.info("Agronomist digest sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send agronomist digest to %s: %s", to_email, e)


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
    from datetime import date

    health_score_pct = round(health_score * 100) if health_score <= 1 else round(health_score)
    health_color = "green" if health_score_pct >= 70 else ("amber" if health_score_pct >= 40 else "red")

    try:
        html = _jinja_env.get_template("soil_test_result.html").render(
            full_name=full_name,
            crop_name=crop_name.capitalize(),
            farm_name=farm_name,
            growth_stage=growth_stage,
            health_score=health_score_pct,
            health_status=health_status,
            health_color=health_color,
            n=round(n, 1), p=round(p, 1), k=round(k, 1),
            ph=round(ph, 2), moisture=round(moisture, 1), temperature=round(temperature, 1),
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
        await _send(to_email, subject, html)
        logger.info("Soil test email sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send soil test email to %s: %s", to_email, e)
