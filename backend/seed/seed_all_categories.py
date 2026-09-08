import sys
import os
import json
import re
from datetime import date, datetime, timedelta

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models import User, Listing, ListingImage, Amenity, ListingAmenity, Booking, Review

def generate_rich_description(title, location):
    return (
        f"Welcome to {title}, situated in the heart of {location}. "
        "Designed with contemporary elegance, open-concept living spaces, and floor-to-ceiling windows, "
        "this property offers a peaceful sanctuary away from the hustle of the city.\n\n"
        "Guests will enjoy high-speed optical fiber internet, premium plush bedding, a fully equipped gourmet kitchen, "
        "and a private balcony with panoramic sunset views. Whether you are traveling for business, a weekend getaway, "
        "or an extended vacation, this space offers unmatched comfort and modern luxury.\n\n"
        "Located within short walking distance of local artisan cafes, fine dining restaurants, and major landmarks. "
        "24/7 self check-in via smart lock and dedicated Superhost support available throughout your stay."
    )

def seed_all_category_listings():
    Base.metadata.create_all(bind=engine)
    json_path = os.path.join(os.path.dirname(__file__), "categories_export.json")
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        category_items = json.load(f)

    db = SessionLocal()
    try:
        # Ensure Host User 2 exists
        host_user = db.query(User).filter(User.id == 2).first()
        if not host_user:
            host_user = User(
                id=2,
                name="Sarah Jenkins (Superhost)",
                email="sarah@example.com",
                role="HOST",
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
            )
            db.add(host_user)
            db.commit()

        # Ensure Guest User 1 & 3 exist for reviews
        guest_1 = db.query(User).filter(User.id == 1).first()
        if not guest_1:
            guest_1 = User(id=1, name="Alex Vance", email="alex@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80")
            db.add(guest_1)
        
        guest_3 = db.query(User).filter(User.id == 3).first()
        if not guest_3:
            guest_3 = User(id=3, name="Priya Verma", email="priya@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80")
            db.add(guest_3)
        db.commit()

        # Ensure basic amenities exist
        amenity_names = ["WiFi", "Kitchen", "Pool", "Free Parking", "Air conditioning", "Dedicated workspace", "TV"]
        amenities_map = {}
        for idx, name in enumerate(amenity_names):
            amenity = db.query(Amenity).filter(Amenity.name == name).first()
            if not amenity:
                amenity = Amenity(id=idx + 1, name=name)
                db.add(amenity)
                db.commit()
                db.refresh(amenity)
            amenities_map[name] = amenity.id

        gallery_pool = [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
        ]

        today = date.today()
        added_count = 0
        for item in category_items:
            item_id = item["id"]
            existing = db.query(Listing).filter(Listing.id == item_id).first()
            if existing:
                continue

            # Calculate price
            price_numbers = re.findall(r'\d+', item["priceText"].replace(',', ''))
            price_val = int(price_numbers[0]) if price_numbers else 5000
            if "for 2 nights" in item["priceText"] and price_val > 1000:
                price_per_night = price_val // 2
            else:
                price_per_night = price_val

            prop_type = "Villa" if "Villa" in item["title"] else ("Apartment" if "Flat" in item["title"] or "Studio" in item["title"] else "Entire House")
            if item["category"] == "experiences":
                prop_type = "Guided Tour & Experience"
            elif item["category"] == "services":
                prop_type = "Personal Hospitality Service"

            listing = Listing(
                id=item_id,
                host_id=2,
                title=item["title"],
                description=generate_rich_description(item["title"], item["location"]),
                property_type=prop_type,
                location=item["location"],
                price_per_night=price_per_night,
                max_guests=6,
                bedrooms=3,
                beds=3,
                bathrooms=2,
                latitude=28.5355 + (item_id % 20) * 0.01,
                longitude=77.3910 + (item_id % 20) * 0.01
            )
            db.add(listing)
            db.flush()

            # Add 5 images
            images = [item["imageUrl"]] + gallery_pool[1:5]
            for idx, img_url in enumerate(images):
                img = ListingImage(listing_id=listing.id, url=img_url, position=idx)
                db.add(img)

            # Add amenities
            for name, amenity_id in amenities_map.items():
                la = ListingAmenity(listing_id=listing.id, amenity_id=amenity_id)
                db.add(la)

            # Create completed booking for reviews
            bk1 = Booking(
                listing_id=listing.id,
                guest_id=2,
                check_in=today - timedelta(days=20),
                check_out=today - timedelta(days=18),
                guests=2,
                status="COMPLETED",
                price_per_night=price_per_night,
                cleaning_fee=1500,
                service_fee=int(price_per_night * 2 * 0.1),
                total_price=price_per_night * 2 + 1500 + int(price_per_night * 2 * 0.1),
                created_at=datetime.utcnow() - timedelta(days=25)
            )
            bk2 = Booking(
                listing_id=listing.id,
                guest_id=3,
                check_in=today - timedelta(days=10),
                check_out=today - timedelta(days=8),
                guests=2,
                status="COMPLETED",
                price_per_night=price_per_night,
                cleaning_fee=1500,
                service_fee=int(price_per_night * 2 * 0.1),
                total_price=price_per_night * 2 + 1500 + int(price_per_night * 2 * 0.1),
                created_at=datetime.utcnow() - timedelta(days=15)
            )
            db.add(bk1)
            db.add(bk2)
            db.flush()

            # Add 2 reviews
            rev1 = Review(
                listing_id=listing.id,
                user_id=1,
                booking_id=bk1.id,
                rating=5,
                comment="Absolutely breathtaking stay! The host was super responsive and the place was impeccably clean."
            )
            rev2 = Review(
                listing_id=listing.id,
                user_id=3,
                booking_id=bk2.id,
                rating=5,
                comment="Top-notch hospitality. The location is very peaceful and near everything we needed. Highly recommended!"
            )
            db.add(rev1)
            db.add(rev2)

            added_count += 1

        db.commit()
        print(f"Successfully seeded {added_count} category listings into database!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding category listings: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_all_category_listings()
