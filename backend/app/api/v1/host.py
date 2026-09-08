from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user, get_current_host
from app.models.user import User
from app.schemas.listing import ListingDraftCreate, ListingDetailOut, ListingCardOut, HostSettingsUpdate
from app.services import host_service, listing_service

router = APIRouter(prefix="/host", tags=["Host"])

@router.get("/settings")
def get_host_settings(
    listing_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_host)
):
    """Get pricing, availability, discounts and cancellation settings for a host listing."""
    listings = host_service.get_host_listings(db, current_user.id)
    host_fee_pct = round(settings.HOST_SERVICE_FEE_PERCENTAGE * 100, 1)

    if not listings:
        return {
            "listing_id": None,
            "price_per_night": settings.DEFAULT_PRICE_PER_NIGHT,
            "weekend_price_percent": settings.DEFAULT_WEEKEND_PRICE_PERCENT,
            "weekly_discount_percent": settings.DEFAULT_WEEKLY_DISCOUNT_PERCENT,
            "monthly_discount_percent": settings.DEFAULT_MONTHLY_DISCOUNT_PERCENT,
            "min_nights": settings.DEFAULT_MIN_NIGHTS,
            "max_nights": settings.DEFAULT_MAX_NIGHTS,
            "cancellation_policy_short": settings.DEFAULT_CANCELLATION_SHORT,
            "cancellation_policy_long": settings.DEFAULT_CANCELLATION_LONG,
            "host_fee_percentage": host_fee_pct
        }
    target = None
    if listing_id:
        target = next((l for l in listings if l.id == listing_id), None)
    if not target:
        target = listings[0]

    return {
        "listing_id": target.id,
        "price_per_night": target.price_per_night if target.price_per_night is not None else settings.DEFAULT_PRICE_PER_NIGHT,
        "weekend_price_percent": target.weekend_price_percent if target.weekend_price_percent is not None else settings.DEFAULT_WEEKEND_PRICE_PERCENT,
        "weekly_discount_percent": target.weekly_discount_percent if target.weekly_discount_percent is not None else settings.DEFAULT_WEEKLY_DISCOUNT_PERCENT,
        "monthly_discount_percent": target.monthly_discount_percent if target.monthly_discount_percent is not None else settings.DEFAULT_MONTHLY_DISCOUNT_PERCENT,
        "min_nights": target.min_nights if target.min_nights is not None else settings.DEFAULT_MIN_NIGHTS,
        "max_nights": target.max_nights if target.max_nights is not None else settings.DEFAULT_MAX_NIGHTS,
        "cancellation_policy_short": target.cancellation_policy_short or settings.DEFAULT_CANCELLATION_SHORT,
        "cancellation_policy_long": target.cancellation_policy_long or settings.DEFAULT_CANCELLATION_LONG,
        "host_fee_percentage": host_fee_pct
    }

@router.put("/settings")
def update_host_settings(
    data: HostSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_host)
):
    """Update pricing, discounts, availability, or cancellation policies in DB."""
    updated = host_service.update_host_settings(db, current_user.id, data)
    host_fee_pct = round(settings.HOST_SERVICE_FEE_PERCENTAGE * 100, 1)

    return {
        "listing_id": updated.id,
        "price_per_night": updated.price_per_night if updated.price_per_night is not None else settings.DEFAULT_PRICE_PER_NIGHT,
        "weekend_price_percent": updated.weekend_price_percent if updated.weekend_price_percent is not None else settings.DEFAULT_WEEKEND_PRICE_PERCENT,
        "weekly_discount_percent": updated.weekly_discount_percent if updated.weekly_discount_percent is not None else settings.DEFAULT_WEEKLY_DISCOUNT_PERCENT,
        "monthly_discount_percent": updated.monthly_discount_percent if updated.monthly_discount_percent is not None else settings.DEFAULT_MONTHLY_DISCOUNT_PERCENT,
        "min_nights": updated.min_nights if updated.min_nights is not None else settings.DEFAULT_MIN_NIGHTS,
        "max_nights": updated.max_nights if updated.max_nights is not None else settings.DEFAULT_MAX_NIGHTS,
        "cancellation_policy_short": updated.cancellation_policy_short or settings.DEFAULT_CANCELLATION_SHORT,
        "cancellation_policy_long": updated.cancellation_policy_long or settings.DEFAULT_CANCELLATION_LONG,
        "host_fee_percentage": host_fee_pct
    }

@router.post("/onboarding/draft", response_model=ListingDetailOut)
def save_draft(
    data: ListingDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save or update an onboarding draft listing."""
    listing = host_service.save_or_update_draft(db, current_user.id, data)
    return listing_service.get_listing_detail(db, listing.id) or listing

@router.post("/onboarding/publish/{draft_id}", response_model=ListingDetailOut)
def publish_draft(
    draft_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish a draft listing to the live main feed."""
    listing = host_service.publish_draft(db, current_user.id, draft_id)
    return listing_service.get_listing_detail(db, listing.id) or listing

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_host)
):
    """Get host reservations and metrics."""
    return host_service.get_host_dashboard(db, current_user.id)

@router.get("/listings", response_model=List[ListingCardOut])
def get_host_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_host)
):
    """Get all listings owned by current host (drafts + published)."""
    listings = host_service.get_host_listings(db, current_user.id)
    rating_stats = listing_service.get_listing_rating_stats_map(db, [l.id for l in listings])
    
    result = []
    for l in listings:
        avg_rating, review_count = rating_stats.get(l.id, (0.0, 0))
        cover_img = l.images[0].url if l.images else None
        result.append(
            ListingCardOut(
                id=l.id,
                title=l.title or "Untitled listing",
                location=l.location or "Draft location",
                property_type=l.property_type or "Home",
                price_per_night=l.price_per_night or 0,
                max_guests=l.max_guests or 1,
                bedrooms=l.bedrooms or 1,
                beds=l.beds or 1,
                bathrooms=l.bathrooms or 1,
                status=l.status or "DRAFT",
                is_published=l.is_published,
                cover_image=cover_img,
                images=[img.url for img in l.images],
                rating=avg_rating,
                review_count=review_count,
                host_name=current_user.name,
                created_at=l.created_at
            )
        )
    return result
