from datetime import date, datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, not_, or_
from fastapi import HTTPException
from app.models.listing import Listing, ListingImage, Amenity, ListingAmenity
from app.models.booking import Booking
from app.models.review import Review
from app.schemas.listing import ListingCardOut, ListingDetailOut, PaginatedListingsOut, ListingCreate, ListingUpdate

def get_listing_rating_stats(db: Session, listing_id: int):
    res = db.query(
        func.avg(Review.rating).label("avg_rating"),
        func.count(Review.id).label("review_count")
    ).filter(Review.listing_id == listing_id).first()
    
    avg_rating = round(float(res.avg_rating), 2) if res.avg_rating else 0.0
    review_count = int(res.review_count) if res.review_count else 0
    return avg_rating, review_count

def get_listing_rating_stats_map(db: Session, listing_ids: List[int]):
    """Fetch card ratings in one grouped query instead of one query per card."""
    if not listing_ids:
        return {}
    rows = db.query(
        Review.listing_id, func.avg(Review.rating), func.count(Review.id)
    ).filter(Review.listing_id.in_(listing_ids)).group_by(Review.listing_id).all()
    stats = {listing_id: (0.0, 0) for listing_id in listing_ids}
    for listing_id, average, count in rows:
        stats[listing_id] = (round(float(average), 2), int(count))
    return stats

def get_paginated_listings(
    db: Session,
    location: Optional[str] = None,
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: Optional[int] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    property_type: Optional[str] = None,
    amenities: Optional[List[str]] = None,
    page: int = 1,
    limit: int = 12
) -> PaginatedListingsOut:
    query = db.query(Listing).options(
        selectinload(Listing.images),
        selectinload(Listing.amenities),
        joinedload(Listing.host)
    )

    # Retired listings stay in history but never appear in discovery.
    query = query.filter(Listing.is_active.is_(True))
    # Draft listings during onboarding are hidden from guest feeds until published
    query = query.filter(Listing.status != "DRAFT")

    # Comprehensive Fuzzy Location Search
    if location and location.strip():
        loc_raw = location.strip().lower()
        
        # Mapping for location aliases & regional synonyms
        aliases = {
            "gurgaon": ["gurgaon", "gurugram", "haryana", "sector 31", "sector 45", "golf course road"],
            "gurugram": ["gurgaon", "gurugram", "haryana", "sector 31", "sector 45"],
            "delhi": ["delhi", "new delhi", "south delhi", "connaught place", "india gate", "south extension"],
            "new delhi": ["delhi", "new delhi", "south delhi", "connaught place", "india gate"],
            "goa": ["goa", "north goa", "candolim", "assagao", "baga", "calangute"],
            "north goa": ["goa", "north goa", "candolim", "assagao", "baga"],
            "varanasi": ["varanasi", "kashi", "banaras", "uttar pradesh"],
            "noida": ["noida", "sector 63", "sector 128", "sector 75", "sector 50", "sector 137", "sector 44"],
            "dehradun": ["dehradun", "uttarakhand", "armwala"],
            "mumbai": ["mumbai", "bandra", "maharashtra"],
            "jaipur": ["jaipur", "rajasthan", "pink city"],
            "manali": ["manali", "solang", "himachal"],
            "rishikesh": ["rishikesh", "laxman jhula", "uttarakhand"],
        }
        
        stop_words = {"district", "near", "you", "for", "sights", "like", "popular", "beach", "destination", "a", "hidden", "gem", "state", "india"}
        tokens = [t.strip(",. ") for t in loc_raw.split() if t.strip(",. ") not in stop_words and len(t.strip(",. ")) > 1]
        
        search_terms = set(tokens)
        if loc_raw not in stop_words:
            search_terms.add(loc_raw)
            
        for token in list(tokens):
            for alias_key, alias_vals in aliases.items():
                if token == alias_key or token in alias_key or alias_key in token:
                    search_terms.update(alias_vals)
                    
        if search_terms:
            location_conditions = []
            for term in search_terms:
                pattern = f"%{term}%"
                location_conditions.append(Listing.location.ilike(pattern))
                location_conditions.append(Listing.title.ilike(pattern))
                location_conditions.append(Listing.description.ilike(pattern))
                location_conditions.append(Listing.city.ilike(pattern))
                location_conditions.append(Listing.locality.ilike(pattern))
                location_conditions.append(Listing.state.ilike(pattern))
            query = query.filter(or_(*location_conditions))

    # Guest capacity
    if guests and guests > 0:
        query = query.filter(Listing.max_guests >= guests)

    # Price range
    if min_price is not None and min_price >= 0:
        query = query.filter(Listing.price_per_night >= min_price)
    if max_price is not None and max_price >= 0:
        query = query.filter(Listing.price_per_night <= max_price)

    # Property type
    if property_type and property_type.strip():
        query = query.filter(Listing.property_type.ilike(property_type.strip()))

    # Amenities filter (MUST match all supplied amenities)
    if amenities:
        for a_name in amenities:
            if a_name.strip():
                query = query.filter(
                    Listing.amenities.any(Amenity.name.ilike(a_name.strip()))
                )

    # Date availability filter
    if check_in and check_out and check_in < check_out:
        # Exclude listings that have overlapping active bookings
        overlapping_subquery = db.query(Booking.listing_id).filter(
            Booking.status != "CANCELLED",
            Booking.check_in < check_out,
            Booking.check_out > check_in
        ).subquery()

        query = query.filter(not_(Listing.id.in_(overlapping_subquery)))

    offset = (page - 1) * limit
    # Fetch limit+1 to check has_next without a separate COUNT query (saves 1 HTTP round-trip)
    listings = query.order_by(Listing.id.desc()).offset(offset).limit(limit + 1).all()
    has_next = len(listings) > limit
    if has_next:
        listings = listings[:limit]

    # Build DTO items
    rating_stats = get_listing_rating_stats_map(db, [listing.id for listing in listings])
    items: List[ListingCardOut] = []
    for l in listings:
        avg_rating, review_count = rating_stats[l.id]
        cover_img = l.images[0].url if l.images else None
        all_imgs = [img.url for img in l.images]
        
        items.append(
            ListingCardOut(
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
                amenities=[a.name for a in l.amenities],
                rating=avg_rating,
                review_count=review_count,
                host_name=l.host.name if l.host else ""
            )
        )

    return PaginatedListingsOut(
        items=items,
        page=page,
        limit=limit,
        total=len(items),
        has_next=has_next
    )

from app.core.cache import ttl_cache

def get_listing_detail(db: Session, listing_id: int) -> Optional[ListingDetailOut]:
    cache_key = f"listing_detail:{listing_id}"
    cached = ttl_cache.get(cache_key)
    if cached is not None:
        return cached

    listing = db.query(Listing).options(
        joinedload(Listing.images),
        joinedload(Listing.amenities),
        joinedload(Listing.host),
        selectinload(Listing.reviews)
    ).filter(Listing.id == listing_id, Listing.is_active.is_(True)).first()

    if not listing:
        return None

    if listing.reviews:
        ratings = [r.rating for r in listing.reviews if r.rating is not None]
        avg_rating = round(float(sum(ratings) / len(ratings)), 2) if ratings else 0.0
        review_count = len(ratings)
    else:
        avg_rating, review_count = 0.0, 0

    res = ListingDetailOut(
        id=listing.id,
        host_id=listing.host_id,
        host=listing.host,
        title=listing.title,
        description=listing.description,
        property_type=listing.property_type,
        location=listing.location,
        price_per_night=listing.price_per_night,
        max_guests=listing.max_guests,
        bedrooms=listing.bedrooms,
        beds=listing.beds,
        bathrooms=listing.bathrooms,
        latitude=listing.latitude,
        longitude=listing.longitude,
        images=listing.images,
        amenities=listing.amenities,
        rating=avg_rating,
        review_count=review_count,
        created_at=listing.created_at,
        updated_at=listing.updated_at
    )
    ttl_cache.set(cache_key, res, ttl_seconds=30)
    return res

def create_listing(db: Session, host_id: int, data: ListingCreate) -> Listing:
    _validate_amenity_ids(db, data.amenity_ids)
    listing = Listing(
        host_id=host_id,
        title=data.title,
        description=data.description,
        property_type=data.property_type,
        location=data.location,
        price_per_night=data.price_per_night,
        max_guests=data.max_guests,
        bedrooms=data.bedrooms,
        beds=data.beds,
        bathrooms=data.bathrooms,
        latitude=data.latitude,
        longitude=data.longitude
    )
    db.add(listing)
    db.flush()

    # Bulk Insert Images in a single query
    if data.images:
        images_to_insert = [
            {"listing_id": listing.id, "url": img.url, "position": img.position or idx}
            for idx, img in enumerate(data.images)
        ]
        db.bulk_insert_mappings(ListingImage, images_to_insert)

    # Bulk Insert Amenities in a single query
    if data.amenity_ids:
        amenities_to_insert = [
            {"listing_id": listing.id, "amenity_id": a_id}
            for a_id in data.amenity_ids
        ]
        db.bulk_insert_mappings(ListingAmenity, amenities_to_insert)

    db.commit()
    db.refresh(listing)
    return listing

def update_listing(db: Session, listing_id: int, data: ListingUpdate) -> Listing:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    amenity_ids = update_dict.pop("amenity_ids", None)
    images_data = update_dict.pop("images", None)

    for key, val in update_dict.items():
        setattr(listing, key, val)

    if amenity_ids is not None:
        _validate_amenity_ids(db, amenity_ids)
        db.query(ListingAmenity).filter(ListingAmenity.listing_id == listing.id).delete()
        if amenity_ids:
            amenities_to_insert = [{"listing_id": listing.id, "amenity_id": a_id} for a_id in amenity_ids]
            db.bulk_insert_mappings(ListingAmenity, amenities_to_insert)

    if images_data is not None:
        db.query(ListingImage).filter(ListingImage.listing_id == listing.id).delete()
        if images_data:
            images_to_insert = []
            for idx, img_data in enumerate(images_data):
                url = img_data.get("url") if isinstance(img_data, dict) else img_data.url
                pos = img_data.get("position", idx) if isinstance(img_data, dict) else img_data.position
                images_to_insert.append({"listing_id": listing.id, "url": url, "position": pos})
            db.bulk_insert_mappings(ListingImage, images_to_insert)

    db.commit()
    db.refresh(listing)
    return listing

def delete_listing(db: Session, listing_id: int) -> bool:
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        return False

    # Soft delete: preserve bookings/reviews in DB, mark inactive and unpublished
    listing.is_active = False
    listing.is_published = False
    listing.status = "UNPUBLISHED"
    listing.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True

def _validate_amenity_ids(db: Session, amenity_ids: List[int]) -> None:
    if len(amenity_ids) != len(set(amenity_ids)):
        raise HTTPException(status_code=400, detail="Amenities cannot contain duplicates.")
    if not amenity_ids:
        return
    found = db.query(Amenity.id).filter(Amenity.id.in_(amenity_ids)).count()
    if found != len(amenity_ids):
        raise HTTPException(status_code=400, detail="One or more amenities do not exist.")
