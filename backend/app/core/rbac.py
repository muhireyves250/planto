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

# Keyed by email (not token) so an admin action (deactivate/delete) can
# invalidate a user's session immediately instead of waiting out the TTL.
_cache: Dict[str, Tuple[_CachedUser, float]] = {}


def _cache_get(email: str) -> Optional[_CachedUser]:
    entry = _cache.get(email)
    if entry and (time.monotonic() - entry[1]) < _CACHE_TTL:
        return entry[0]
    _cache.pop(email, None)
    return None


def _cache_set(email: str, user: _CachedUser) -> None:
    _cache[email] = (user, time.monotonic())
    # Evict expired entries when the cache grows large
    if len(_cache) > 2000:
        cutoff = time.monotonic() - _CACHE_TTL
        expired = [k for k, v in _cache.items() if v[1] < cutoff]
        for k in expired:
            del _cache[k]


def invalidate_user_cache(email: str) -> None:
    """Call after an admin deactivates or deletes a user so their next request is rejected immediately."""
    _cache.pop(email, None)


# ── Revoked tokens (explicit logout) ──────────────────────────────────────────
# Cache invalidation alone doesn't stop token reuse after a *voluntary* logout —
# the account is still active, so the next request would just re-populate the
# cache. A logged-out token must be rejected outright until it naturally expires.
_revoked_tokens: Dict[str, float] = {}  # token -> exp (epoch seconds)


def revoke_token(token: str) -> None:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM],
            options={"verify_exp": False},
        )
        exp = payload.get("exp", time.time() + 900)
    except JWTError:
        exp = time.time() + 900
    _revoked_tokens[token] = exp

    if len(_revoked_tokens) > 5000:
        now = time.time()
        expired = [t for t, e in _revoked_tokens.items() if e < now]
        for t in expired:
            del _revoked_tokens[t]


def _decode_email(token: str) -> str:
    if token in _revoked_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise ValueError("no sub")
        return email
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def _user_from_db(email: str, db: Session) -> _CachedUser:
    """Load user from DB once, cache the result. Rejects deactivated/deleted accounts."""
    user = user_repo.get_user_by_email(db, email=email)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    cached = _CachedUser(id=user.id, email=user.email, role=user.role, full_name=user.full_name)
    _cache_set(email, cached)
    return cached


# ── Public auth dependencies ──────────────────────────────────────────────────

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = _decode_email(token)
    cached = _cache_get(email)
    if cached:
        return cached
    return _user_from_db(email, db)


async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[_CachedUser]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        email = _decode_email(token)
    except HTTPException:
        return None
    cached = _cache_get(email)
    if cached:
        return cached
    try:
        return _user_from_db(email, db)
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
