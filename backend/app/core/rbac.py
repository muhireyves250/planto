import time
from dataclasses import dataclass
from typing import Optional, Dict, Tuple
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.repositories import user_repo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ── In-memory user cache ──────────────────────────────────────────────────────
# JWT tokens expire in 30 min; we cache for 28 min to stay safe.
# This eliminates a DB round-trip on every authenticated request.
_CACHE_TTL = 28 * 60

@dataclass
class _CachedUser:
    id: UUID
    email: str
    role: str
    full_name: str

_cache: Dict[str, Tuple[_CachedUser, float]] = {}


def _cache_get(token: str) -> Optional[_CachedUser]:
    entry = _cache.get(token)
    if entry and (time.monotonic() - entry[1]) < _CACHE_TTL:
        return entry[0]
    _cache.pop(token, None)
    return None


def _cache_set(token: str, user: _CachedUser) -> None:
    _cache[token] = (user, time.monotonic())
    # Evict expired entries when the cache grows large
    if len(_cache) > 2000:
        cutoff = time.monotonic() - _CACHE_TTL
        expired = [k for k, v in _cache.items() if v[1] < cutoff]
        for k in expired:
            del _cache[k]


def _user_from_db(token: str, db: Session) -> _CachedUser:
    """Decode token, load user from DB once, cache the result."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise ValueError("no sub")
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = user_repo.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cached = _CachedUser(id=user.id, email=user.email, role=user.role, full_name=user.full_name)
    _cache_set(token, cached)
    return cached


# ── Public auth dependencies ──────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    cached = _cache_get(token)
    if cached:
        return cached
    return _user_from_db(token, db)


async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[_CachedUser]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    cached = _cache_get(token)
    if cached:
        return cached
    try:
        return _user_from_db(token, db)
    except HTTPException:
        return None


def role_required(allowed_roles: list):
    async def role_checker(current_user=Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' does not have access to this resource",
            )
        return current_user
    return role_checker
