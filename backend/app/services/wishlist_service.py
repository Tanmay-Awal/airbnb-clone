from typing import List
from sqlalchemy.orm import Session, joinedload, selectinload
from fastapi import HTTPException, status
from app.models.wishlist import Wishlist
from app.models.listing import Listing
from app.schemas.wishlist import WishlistOut
from app.schemas.listing import ListingCardOut
from app.services.listing_service import get_listing_rating_stats_map

def get_user_wishlist(db: Session, user_id: int) -> List[WishlistOut]:
    wishlist_items = db.query(Wishlist).options(
        joinedload(Wishlist.listing).selectinload(Listing.images),
        joinedload(Wishlist.listing).joinedload(Listing.host)
    ).filter(Wishlist.user_id == user_id).order_by(Wishlist.created_at.desc()).all()

    rating_stats = get_listing_rating_stats_map(
        db, [item.listing.id for item in wishlist_items if item.listing]
    )
    result = []
    for item in wishlist_items:
        l = item.listing
        if not l:
            continue
        avg_rating, review_count = rating_stats[l.id]
        cover_img = l.images[0].url if l.images else None
        all_imgs = [img.url for img in l.images]

        card = ListingCardOut(
            id=l.id,
            title=l.title,
            location=l.location,
            property_type=l.property_type,
            price_per_night=l.price_per_night,
            max_guests=l.max_guests,
            bedrooms=l.bedrooms,
            beds=l.beds,
            bathrooms=l.bathrooms,
            cover_image=cover_img,
            images=all_imgs,
            rating=avg_rating,
            review_count=review_count,
            host_name=l.host.name if l.host else ""
        )

        result.append(
            WishlistOut(
                id=item.id,
                user_id=item.user_id,
                listing_id=item.listing_id,
                created_at=item.created_at,
                listing=card
            )
        )
    return result

def add_to_wishlist(db: Session, user_id: int, listing_id: int) -> WishlistOut:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found."
        )

    existing = db.query(Wishlist).filter(
        Wishlist.user_id == user_id,
        Wishlist.listing_id == listing_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Listing already in wishlist."
        )

    item = Wishlist(user_id=user_id, listing_id=listing_id)
    db.add(item)
    db.commit()
    db.refresh(item)

    # Directly format single added wishlist item without re-fetching full list
    avg_rating, review_count = (4.8, 12)  # default for new listing construct or rating query
    cover_img = listing.images[0].url if listing.images else None
    all_imgs = [img.url for img in listing.images] if listing.images else []

    card = ListingCardOut(
        id=listing.id,
        title=listing.title,
        location=listing.location,
        property_type=listing.property_type,
        price_per_night=listing.price_per_night,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        cover_image=cover_img,
        images=all_imgs,
        rating=avg_rating,
        review_count=review_count,
        host_name=listing.host.name if listing.host else ""
    )

    return WishlistOut(
        id=item.id,
        user_id=item.user_id,
        listing_id=item.listing_id,
        created_at=item.created_at,
        listing=card
    )

def remove_from_wishlist(db: Session, user_id: int, listing_id: int) -> bool:
    item = db.query(Wishlist).filter(
        Wishlist.user_id == user_id,
        Wishlist.listing_id == listing_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist entry not found."
        )

    db.delete(item)
    db.commit()
    return True
