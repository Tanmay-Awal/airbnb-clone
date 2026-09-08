from datetime import datetime
from pydantic import BaseModel
from app.schemas.listing import ListingCardOut

class WishlistOut(BaseModel):
    id: int
    user_id: int
    listing_id: int
    created_at: datetime
    listing: ListingCardOut

    class Config:
        from_attributes = True
