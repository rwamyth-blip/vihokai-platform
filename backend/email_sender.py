"""
Transactional email for VihokAI — used by the "forgot password" flow.

Delivery backends, tried in order:
  1. Resend  (RESEND_API_KEY + RESEND_FROM_EMAIL) — HTTPS, works everywhere
  2. SMTP    (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM)
  3. Console fallback — prints the message so the flow is still testable

Resend comes first because Render blocks outbound SMTP on several plans,
while HTTPS (443) always works. The console fallback means "forgot password"
is fully functional end-to-end even before email credentials exist: the
reset link shows up in the Render logs instead of an inbox.

Nothing here is async on the caller's side except `send_email`.
"""

import asyncio
import os
import smtplib
from email.message import EmailMessage

import httpx

RESEND_API_URL = "https://api.resend.com/emails"
DEFAULT_FROM = "ViHok AI <noreply@vihokai.com>"
RESEND_TIMEOUT = 15.0


def from_address() -> str:
    """Display name + address used as the sender. Must be a verified domain."""
    return os.getenv("RESEND_FROM_EMAIL") or os.getenv("SMTP_FROM") or DEFAULT_FROM


def active_backend() -> str:
    """Which transport will be used — handy for /health and diagnostics."""
    if os.getenv("RESEND_API_KEY"):
        return "resend"
    if os.getenv("SMTP_HOST") and os.getenv("SMTP_USER"):
        return "smtp"
    return "console"


def _postal_address() -> str:
    """Extract the bare address from 'Name <addr@host>'."""
    sender = from_address()
    if "<" in sender and ">" in sender:
        return sender[sender.index("<") + 1 : sender.index(">")].strip()
    return sender.strip()


# ------------------------------------------------------------------ resend ----
async def _send_via_resend(to: str, subject: str, html: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    payload = {
        "from": from_address(),
        "to": [to],
        "subject": subject,
        "html": html,
    }
    async with httpx.AsyncClient(timeout=RESEND_TIMEOUT) as client:
        response = await client.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
    if response.status_code >= 400:
        print(f"email/resend failed: HTTP {response.status_code} {response.text[:300]}")
        return False
    return True


# ------------------------------------------------------------------- smtp ----
def _send_via_smtp_blocking(to: str, subject: str, html: str) -> bool:
    host = os.getenv("SMTP_HOST", "")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASSWORD", "")
    use_ssl = os.getenv("SMTP_USE_SSL", "").lower() in {"1", "true", "yes"}

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_address()
    message["To"] = to
    message.set_content("โปรดเปิดอีเมลนี้ในโปรแกรมที่แสดง HTML ได้")
    message.add_alternative(html, subtype="html")

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                server.login(user, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.starttls()
                server.login(user, password)
                server.send_message(message)
        return True
    except Exception as error:
        print(f"email/smtp failed: {type(error).__name__}: {error}")
        return False


# ---------------------------------------------------------------- public -----
async def send_email(to: str, subject: str, html: str) -> bool:
    """Best-effort send. Never raises — the caller always returns a generic reply."""
    backend = active_backend()

    if backend == "resend":
        try:
            return await _send_via_resend(to, subject, html)
        except Exception as error:
            print(f"email/resend error: {type(error).__name__}: {error}")
            return False

    if backend == "smtp":
        return await asyncio.to_thread(_send_via_smtp_blocking, to, subject, html)

    # Console fallback — the reset link lands in the Render logs.
    print("=" * 70)
    print("email/console  (no RESEND_API_KEY / SMTP_* configured)")
    print(f"  to      : {to}")
    print(f"  from    : {_postal_address()}")
    print(f"  subject : {subject}")
    print("  --- plain text preview ---")
    for line in html.replace("<br>", "\n").splitlines():
        text = line.strip()
        if text.startswith(("http://", "https://")) or "reset" in text.lower():
            print(f"  {text[:160]}")
    print("=" * 70)
    return False


def password_reset_email(reset_url: str, expires_minutes: int) -> tuple[str, str]:
    """Return (subject, html) for the password reset mail."""
    subject = "รีเซ็ตรหัสผ่าน ViHok AI / Reset your ViHok AI password"
    html = f"""\
<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
  <h2 style="margin:0 0 8px;font-size:20px">รีเซ็ตรหัสผ่าน ViHok AI</h2>
  <p style="margin:0 0 24px;color:#475569;font-size:15px">
    เราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีนี้<br>
    <span style="color:#64748b">We received a request to reset your password.</span>
  </p>

  <a href="{reset_url}"
     style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;
            padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px">
    ตั้งรหัสผ่านใหม่ / Reset password
  </a>

  <p style="margin:24px 0 8px;color:#475569;font-size:14px">
    ลิงก์นี้จะหมดอายุใน {expires_minutes} นาที และใช้ได้ครั้งเดียว<br>
    <span style="color:#64748b">This link expires in {expires_minutes} minutes and can be used once.</span>
  </p>

  <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;word-break:break-all">
    ถ้าปุ่มกดไม่ได้ ให้คัดลอกลิงก์นี้:<br>{reset_url}
  </p>

  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">

  <p style="margin:0;color:#94a3b8;font-size:13px">
    ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่ต้องทำอะไร — รหัสผ่านเดิมยังใช้ได้ปกติ<br>
    <span style="color:#cbd5e1">If you didn't request this, you can safely ignore this email.</span>
  </p>
</div>
"""
    return subject, html
