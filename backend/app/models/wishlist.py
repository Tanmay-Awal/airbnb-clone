from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="wishlists")
    listing = relationship("Listing", back_populates="wishlist_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "listing_id", name="uq_user_wishlist_listing"),
    )
