import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.core.config import settings

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.listings import router as listings_router
from app.api.v1.bookings import router as bookings_router
from app.api.v1.host import router as host_router
from app.api.v1.wishlist import router as wishlist_router
from app.api.v1.reviews import router as reviews_router

from app.core.rate_limiter import RateLimitMiddleware
from app.core.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api.timer")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Request Timing Logger Middleware
class TimingLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        # Log to terminal console
        print(f"⏱️ [PERF] {request.method} {request.url.path} -> Status {response.status_code} ({process_time_ms} ms)")
        logger.info(f"{request.method} {request.url.path} took {process_time_ms} ms")
        
        response.headers["X-Process-Time"] = f"{process_time_ms}ms"
        return response

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(TimingLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Rate Limiting Protection Middleware
app.add_middleware(RateLimitMiddleware, strict_limit=10, general_limit=100, window_seconds=60)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(listings_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(host_router, prefix=settings.API_V1_STR)
app.include_router(wishlist_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)

@app.get("/")
@app.head("/")
def root():
    return {
        "message": "Airbnb Fullstack Clone API is running",
        "docs": "/docs",
        "version": settings.VERSION
    }

@app.get("/health")
@app.head("/health")
@app.get("/healthz")
@app.head("/healthz")
@app.get("/api/health")
@app.head("/api/health")
def health_check():
    """Health check with database connectivity verification."""
    from sqlalchemy import text
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


