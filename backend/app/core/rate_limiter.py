import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("app.security.rate_limiter")

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory Rate Limiting Middleware for FastAPI endpoints.
    Protects authentication (login/signup) and public endpoints against DDoS / stress attacks.
    
    - Strict Limit: 10 requests / 60s per client IP on sensitive routes (/api/auth/login, /api/auth/signup)
    - General Limit: 100 requests / 60s per client IP on all public routes
    - Memory Leak Prevention: Periodically purges stale IP entries when empty.
    - Returns 429 TOO MANY REQUESTS when exceeded.
    """
    def __init__(self, app, strict_limit: int = 10, general_limit: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.strict_limit = strict_limit
        self.general_limit = general_limit
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.last_cleanup = time.time()

    def _cleanup_stale_keys(self, now: float):
        """Purge keys that have no timestamps within the active window to prevent memory leak."""
        # Run cleanup at most once every window_seconds
        if now - self.last_cleanup < self.window_seconds:
            return
        self.last_cleanup = now
        stale_keys = [
            key for key, timestamps in self.requests.items()
            if not any(now - ts < self.window_seconds for ts in timestamps)
        ]
        for key in stale_keys:
            del self.requests[key]

    async def dispatch(self, request: Request, call_next):
        # Extract client IP
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()

        self._cleanup_stale_keys(now)

        # Clean up timestamps older than window_seconds for this client
        path = request.url.path
        is_strict_path = path.endswith("/auth/login") or path.endswith("/auth/signup") or path.endswith("/demo/login")

        limit = self.strict_limit if is_strict_path else self.general_limit
        key = f"{client_ip}:{path if is_strict_path else 'general'}"

        timestamps = self.requests[key]
        # Keep only timestamps within the rolling window
        valid_timestamps = [ts for ts in timestamps if now - ts < self.window_seconds]

        if not valid_timestamps:
            self.requests.pop(key, None)
        else:
            self.requests[key] = valid_timestamps

        if len(valid_timestamps) >= limit:
            logger.warning(f"Rate limit exceeded for IP: {client_ip} on path: {path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Rate limit exceeded. Please wait a minute before trying again.",
                    "retry_after_seconds": int(self.window_seconds - (now - valid_timestamps[0]))
                },
                headers={"Retry-After": str(self.window_seconds)}
            )

        # Record this request timestamp
        self.requests[key].append(now)

        response = await call_next(request)
        return response
