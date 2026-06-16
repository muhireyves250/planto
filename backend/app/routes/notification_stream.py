import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.core.database import get_db
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/stream")
async def notification_stream(
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """SSE endpoint — accepts token as query param (EventSource can't set headers)."""
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    from app.services import notification_service
    q = notification_service.register_sse(user_id)

    async def generator():
        try:
            while True:
                try:
                    p = await asyncio.wait_for(q.get(), timeout=20)
                    yield f"data: {json.dumps(p)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            notification_service.unregister_sse(user_id)

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
