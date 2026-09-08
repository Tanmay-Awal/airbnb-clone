from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field

class PriceBreakdown(BaseModel):
    nights: int
    price_per_night: int
    base_price: int
    cleaning_fee: int
    service_fee: int
    total_price: int

class BookingCreate(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(gt=0)

class ListingSummary(BaseModel):
    id: int
    title: str
    location: str
    property_type: Optional[str] = None
    cover_image: Optional[str] = None
    price_per_night: Optional[int] = None

    class Config:
        from_attributes = True

class GuestSummary(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class BookingOut(BaseModel):
    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    status: str
    total_price: int
    created_at: datetime
    listing: Optional[ListingSummary] = None
    guest: Optional[GuestSummary] = None
    price_breakdown: Optional[PriceBreakdown] = None

    class Config:
        from_attributes = True

class AvailabilityResponse(BaseModel):
    available: bool
    reason: Optional[str] = None
    price_breakdown: Optional[PriceBreakdown] = None
