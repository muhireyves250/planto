"""
Central notification service.
- SSE: maintains per-user asyncio.Queue; broadcast() puts events onto it.
- Web Push: sends push to all subscriptions for a user via pywebpush.
"""
import asyncio
import json
import logging
from typing import Optional
from uuid import UUID

from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory SSE queues: user_id (str) → asyncio.Queue
_sse_queues: dict[str, asyncio.Queue] = {}


def register_sse(user_id: str) -> asyncio.Queue:
    """Called when a client opens the /notifications/stream endpoint."""
    q = asyncio.Queue(maxsize=50)
    _sse_queues[user_id] = q
    return q


def unregister_sse(user_id: str) -> None:
    _sse_queues.pop(user_id, None)


async def broadcast_sse(user_id: str, payload: dict) -> None:
    """Push an event to the user's SSE queue if they are connected."""
    q = _sse_queues.get(user_id)
    if q:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            logger.warning("SSE queue full for user %s — dropping event", user_id)


async def send_push(db, user_id: UUID, title: str, body: str, action_url: str = "/") -> None:
    """
    Send a Web Push notification to all subscriptions for this user.
    Silently removes stale subscriptions (410 Gone from push service).
    Runs the blocking pywebpush HTTP call in a thread so the event loop is never blocked.
    """
    if not settings.VAPID_PRIVATE_KEY:
        return

    from pywebpush import webpush, WebPushException
    from app.models.push_subscription import PushSubscription

    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    if not subs:
        return

    payload = json.dumps({"title": title, "body": body, "url": action_url})

    stale_ids = []
    for sub in subs:
        sub_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        sub_id = sub.id

        def _send(info=sub_info):
            from pywebpush import webpush, WebPushException
            try:
                webpush(
                    subscription_info=info,
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={
                        "sub": settings.VAPID_EMAIL,
                        "aud": info["endpoint"].split("/")[2],
                    },
                )
                return None
            except WebPushException as exc:
                return exc

        exc = await asyncio.to_thread(_send)
        if exc is not None:
            if exc.response and exc.response.status_code in (404, 410):
                stale_ids.append(sub_id)
                logger.info("Stale push subscription for user %s — will remove", user_id)
            else:
                logger.warning("Push failed for user %s: %s", user_id, exc)

    if stale_ids:
        from app.models.push_subscription import PushSubscription
        db.query(PushSubscription).filter(PushSubscription.id.in_(stale_ids)).delete(synchronize_session=False)
        db.commit()
