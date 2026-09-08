from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_host
from app.models.user import User
from app.models.listing import Listing
from app.schemas.listing import (
    PaginatedListingsOut,
    ListingDetailOut,
    ListingCreate,
    ListingUpdate,
    ListingCardOut,
    AmenityOut
)
from app.schemas.booking import AvailabilityResponse
from app.services import listing_service, booking_service
from app.models.listing import Amenity

router = APIRouter(prefix="/listings", tags=["Listings"])

@router.get("", response_model=PaginatedListingsOut)
def get_listings(
    location: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = Query(None, ge=1),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    property_type: Optional[str] = None,
    amenities: Optional[List[str]] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Search and filter property listings with pagination."""
    if (check_in is None) != (check_out is None):
        raise HTTPException(status_code=400, detail="Both check-in and check-out dates are required for availability search.")
    if check_in and check_out and check_in >= check_out:
        raise HTTPException(status_code=400, detail="Check-out date must be after check-in date.")
    return listing_service.get_paginated_listings(
        db=db,
        location=location,
        check_in=check_in,
        check_out=check_out,
        guests=guests,
        min_price=min_price,
        max_price=max_price,
        property_type=property_type,
        amenities=amenities,
        page=page,
        limit=limit
    )

_amenities_cache = None

@router.get("/amenities/all", response_model=List[AmenityOut])
def get_all_amenities(db: Session = Depends(get_db)):
    """Return all available amenities for filter bar (cached in memory)."""
    global _amenities_cache
    if _amenities_cache is None:
        _amenities_cache = db.query(Amenity).all()
    return _amenities_cache

@router.get("/{listing_id}", response_model=ListingDetailOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific property listing."""
    listing = listing_service.get_listing_detail(db, listing_id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )
    return listing

@router.get("/{listing_id}/availability", response_model=AvailabilityResponse)
def check_listing_availability(
    listing_id: int,
    check_in: date,
    check_out: date,
    db: Session = Depends(get_db)
):
    """Check if dates are available and get authoritative price quote."""
    return booking_service.check_availability(db, listing_id, check_in, check_out)

@router.post("", response_model=ListingDetailOut, status_code=status.HTTP_201_CREATED)
def create_new_listing(
    data: ListingCreate,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    """Host endpoint: Create a new property listing."""
    listing = listing_service.create_listing(db, current_host.id, data)
    return listing_service.get_listing_detail(db, listing.id)

@router.put("/{listing_id}", response_model=ListingDetailOut)
def update_existing_listing_put(
    listing_id: int,
    data: ListingUpdate,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    """Host endpoint: Update an owned property listing (PUT method)."""
    existing = listing_service.get_listing_detail(db, listing_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )

    if existing.host_id != current_host.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this listing."
        )

    updated = listing_service.update_listing(db, listing_id, data)
    return listing_service.get_listing_detail(db, updated.id)

@router.patch("/{listing_id}", response_model=ListingDetailOut)
def update_existing_listing_patch(
    listing_id: int,
    data: ListingUpdate,
    current_host: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    """Host endpoint: Update an owned property listing (PATCH method)."""
    return update_existing_listing_put(listing_id, data, current_host, db)

@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_listing(
    listing_id: int,
    current_user: User = Depends(get_current_host),
    db: Session = Depends(get_db)
):
    """Host endpoint: soft delete an owned property while preserving its history in DB."""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )

    if listing.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this listing."
        )

    listing_service.delete_listing(db, listing_id)
    return None
