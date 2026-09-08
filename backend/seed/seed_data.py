import sys
import os
from datetime import date, datetime, timedelta

# Ensure backend path is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models import User, Listing, ListingImage, Amenity, ListingAmenity, Booking, Review, Wishlist
from app.services.pricing_service import calculate_price_breakdown

def seed_database():
    print("Checking migrated database...")
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding Users...")
        users = [
            User(id=1, name="Alex Vance", email="alex@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"),
            User(id=2, name="Sarah Jenkins", email="sarah@example.com", role="HOST", avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"),
            User(id=3, name="Rahul Sharma", email="rahul@example.com", role="HOST", avatar_url="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80"),
            User(id=4, name="David Miller", email="david@example.com", role="HOST", avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"),
            User(id=5, name="Tanmay Gupta", email="tanmay@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"),
            User(id=6, name="Priya Patel", email="priya@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"),
            User(id=7, name="Ananya Rao", email="ananya@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"),
            User(id=8, name="Vikram Singh", email="vikram@example.com", role="GUEST", avatar_url="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80"),
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Amenities...")
        amenities_data = [
            "WiFi", "Kitchen", "Pool", "Free Parking", "Air conditioning",
            "Dedicated workspace", "Washing machine", "TV", "Ocean view", "Breakfast"
        ]
        amenities = [Amenity(id=idx+1, name=name) for idx, name in enumerate(amenities_data)]
        db.add_all(amenities)
        db.commit()

        print("Seeding Listings...")
        listings_seed = [
            {
                "id": 1,
                "host_id": 2,  # Sarah
                "title": "Luxury Beachfront Villa with Private Pool",
                "description": "Experience paradise in Candolim, Goa. This stunning 4-bedroom beachfront villa offers floor-to-ceiling sea views, a private infinity pool, lush tropical gardens, and direct private access to the golden sands. Perfect for families or groups looking for unforgettable sunsets.",
                "property_type": "Villa",
                "location": "Candolim, Goa",
                "price_per_night": 12500,
                "max_guests": 8,
                "bedrooms": 4,
                "beds": 5,
                "bathrooms": 4,
                "latitude": 15.516,
                "longitude": 73.762,
                "images": [
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            },
            {
                "id": 2,
                "host_id": 2,  # Sarah
                "title": "Heritage Haveli with Royal Courtyard & Pool",
                "description": "Step into royal grandeur at this meticulously restored 200-year-old Rajasthani Haveli in the heart of Jaipur's Pink City. Featuring handcrafted arches, a peaceful central courtyard, rooftop sunset lounge, and antique furnishings.",
                "property_type": "Heritage Home",
                "location": "Jaipur, Rajasthan",
                "price_per_night": 8500,
                "max_guests": 6,
                "bedrooms": 3,
                "beds": 3,
                "bathrooms": 3,
                "latitude": 26.9124,
                "longitude": 75.7873,
                "images": [
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 3, 4, 5, 6, 8, 10]
            },
            {
                "id": 3,
                "host_id": 3,  # Rahul
                "title": "Cozy Pine Alpine Cabin with Snow Peak Views",
                "description": "Escape to tranquility in Manali. Built entirely with cedar wood and stone, this warm alpine cabin offers breathtaking panoramic views of snow-capped Solang Valley peaks, a cozy indoor fireplace, and high-speed optical fiber for remote work.",
                "property_type": "Cabin",
                "location": "Manali, Himachal Pradesh",
                "price_per_night": 4800,
                "max_guests": 4,
                "bedrooms": 2,
                "beds": 2,
                "bathrooms": 2,
                "latitude": 32.2432,
                "longitude": 77.1892,
                "images": [
                    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1449158743715-0a90ebb6726a?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 5, 6, 8, 10]
            },
            {
                "id": 4,
                "host_id": 3,  # Rahul
                "title": "Modern Sea-Facing Penthouse in Bandra",
                "description": "Contemporary luxury living overlooking the Arabian Sea in Mumbai's trendiest neighborhood. Floor-to-ceiling glass windows, minimalist Scandinavian interiors, smart home automation, and walking distance to iconic cafes.",
                "property_type": "Apartment",
                "location": "Bandra, Mumbai",
                "price_per_night": 11000,
                "max_guests": 4,
                "bedrooms": 2,
                "beds": 2,
                "bathrooms": 2,
                "latitude": 19.0596,
                "longitude": 72.8295,
                "images": [
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 5, 6, 7, 8, 9]
            },
            {
                "id": 5,
                "host_id": 4,  # David
                "title": "Tranquil Backwater Eco Villa & Houseboat Dock",
                "description": "Nestled along the peaceful palm-fringed backwaters of Alleppey, Kerala. Features private waterfront balconies, traditional Kerala cuisine cooked by personal chef upon request, hammocks, and complimentary canoe rides.",
                "property_type": "Villa",
                "location": "Alleppey, Kerala",
                "price_per_night": 6200,
                "max_guests": 5,
                "bedrooms": 2,
                "beds": 3,
                "bathrooms": 2,
                "latitude": 9.4981,
                "longitude": 76.3388,
                "images": [
                    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 5, 8, 9, 10]
            },
            {
                "id": 6,
                "host_id": 4,  # David
                "title": "Lake-View Palace Suite overlooking Lake Pichola",
                "description": "Enjoy majestic views of Udaipur's City Palace and Jag Mandir from your private balcony. Featuring authentic Jharokha seating, regal marble bath, and romantic rooftop dining.",
                "property_type": "Heritage Home",
                "location": "Udaipur, Rajasthan",
                "price_per_night": 9400,
                "max_guests": 3,
                "bedrooms": 1,
                "beds": 2,
                "bathrooms": 1,
                "latitude": 24.5854,
                "longitude": 73.6837,
                "images": [
                    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 3, 5, 6, 8, 10]
            },
            {
                "id": 7,
                "host_id": 2,  # Sarah
                "title": "Charming Riverside Cottage near Laxman Jhula",
                "description": "Immerse yourself in serenity beside the holy Ganges in Rishikesh. Perfect for yoga enthusiasts, digital nomads, and nature lovers. Features organic garden, morning tea deck, and high-speed WiFi.",
                "property_type": "Cottage",
                "location": "Rishikesh, Uttarakhand",
                "price_per_night": 3600,
                "max_guests": 3,
                "bedrooms": 1,
                "beds": 2,
                "bathrooms": 1,
                "latitude": 30.0869,
                "longitude": 78.2676,
                "images": [
                    "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 6, 8, 10]
            },
            {
                "id": 8,
                "host_id": 3,  # Rahul
                "title": "Minimalist Studio in South Extension",
                "description": "Sleek, sundrenched studio apartment in heart of South Delhi. Fully equipped kitchen, high-speed fiber internet, smart TV, and 5-min walk to metro station and buzzing markets.",
                "property_type": "Apartment",
                "location": "South Delhi, Delhi",
                "price_per_night": 3200,
                "max_guests": 2,
                "bedrooms": 1,
                "beds": 1,
                "bathrooms": 1,
                "latitude": 28.5672,
                "longitude": 77.2100,
                "images": [
                    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 5, 6, 7, 8]
            },
            {
                "id": 9,
                "host_id": 2,  # Sarah
                "title": "Modern 3BHK Penthouse with Private Jacuzzi",
                "description": "Spacious penthouse in Sector 62, Noida. Features high-speed Wi-Fi, sleek minimalist interiors, private terrace with Jacuzzi, and 24/7 security.",
                "property_type": "Apartment",
                "location": "Noida, Uttar Pradesh",
                "price_per_night": 5400,
                "max_guests": 6,
                "bedrooms": 3,
                "beds": 3,
                "bathrooms": 3,
                "latitude": 28.6270,
                "longitude": 77.3726,
                "images": [
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 5, 6, 7, 8]
            },
            {
                "id": 10,
                "host_id": 2,  # Sarah
                "title": "Portuguese Style Colonial Villa with Plunge Pool",
                "description": "Nestled in Assagao, Goa. High ceilings, teak wood antiques, lush garden patio, and private outdoor plunge pool surrounded by bougainvillea.",
                "property_type": "Villa",
                "location": "Assagao, Goa",
                "price_per_night": 14500,
                "max_guests": 8,
                "bedrooms": 4,
                "beds": 4,
                "bathrooms": 4,
                "latitude": 15.5900,
                "longitude": 73.7800,
                "images": [
                    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            },
            {
                "id": 11,
                "host_id": 3,  # Rahul
                "title": "Luxury Golf Course Road Suite",
                "description": "Premium luxury suite on Golf Course Road, Gurgaon. Features plush king bed, Italian marble bathroom, work desk, and concierge service.",
                "property_type": "Apartment",
                "location": "Gurgaon, Haryana",
                "price_per_night": 6800,
                "max_guests": 3,
                "bedrooms": 1,
                "beds": 2,
                "bathrooms": 1,
                "latitude": 28.4595,
                "longitude": 77.0266,
                "images": [
                    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 5, 6, 8]
            },
            {
                "id": 12,
                "host_id": 4,  # David
                "title": "Himalayan View Wooden Chalet",
                "description": "Perched on a serene hillside in Shimla. Cedarwood interiors, floor-to-ceiling glass windows, balcony overlooking pine valleys, and cozy fireplace.",
                "property_type": "Cabin",
                "location": "Shimla, Himachal Pradesh",
                "price_per_night": 5200,
                "max_guests": 4,
                "bedrooms": 2,
                "beds": 2,
                "bathrooms": 2,
                "latitude": 31.1048,
                "longitude": 77.1734,
                "images": [
                    "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
                ],
                "amenities": [1, 2, 4, 5, 6, 8, 10]
            }
        ]

        for l_data in listings_seed:
            img_urls = l_data.pop("images")
            amenity_ids = l_data.pop("amenities")
            
            listing = Listing(**l_data)
            db.add(listing)
            db.flush()

            # Add images
            for pos, url in enumerate(img_urls):
                db.add(ListingImage(listing_id=listing.id, url=url, position=pos))

            # Add amenities
            for a_id in amenity_ids:
                db.add(ListingAmenity(listing_id=listing.id, amenity_id=a_id))

        db.commit()

        print("Seeding Initial Bookings & Reviews...")
        today = date.today()

        bookings_data = [
            # Host 2 (Sarah) Bookings
            Booking(id=1, listing_id=1, guest_id=5, check_in=today - timedelta(days=20), check_out=today - timedelta(days=15), guests=4, status="COMPLETED", total_price=71250, created_at=datetime.utcnow() - timedelta(days=30)),
            Booking(id=2, listing_id=2, guest_id=5, check_in=today - timedelta(days=10), check_out=today - timedelta(days=7), guests=2, status="COMPLETED", total_price=29550, created_at=datetime.utcnow() - timedelta(days=25)),
            Booking(id=3, listing_id=9, guest_id=6, check_in=today + timedelta(days=2), check_out=today + timedelta(days=5), guests=3, status="CONFIRMED", total_price=18780, created_at=datetime.utcnow() - timedelta(days=1)),
            Booking(id=4, listing_id=10, guest_id=7, check_in=today + timedelta(days=10), check_out=today + timedelta(days=14), guests=6, status="CONFIRMED", total_price=66700, created_at=datetime.utcnow() - timedelta(days=3)),
            Booking(id=5, listing_id=7, guest_id=8, check_in=today - timedelta(days=5), check_out=today - timedelta(days=2), guests=2, status="COMPLETED", total_price=12420, created_at=datetime.utcnow() - timedelta(days=12)),
            
            # Host 3 (Rahul) Bookings
            Booking(id=6, listing_id=3, guest_id=6, check_in=today + timedelta(days=5), check_out=today + timedelta(days=9), guests=2, status="CONFIRMED", total_price=22620, created_at=datetime.utcnow() - timedelta(days=2)),
            Booking(id=7, listing_id=4, guest_id=7, check_in=today - timedelta(days=15), check_out=today - timedelta(days=12), guests=3, status="COMPLETED", total_price=37950, created_at=datetime.utcnow() - timedelta(days=20)),
            Booking(id=8, listing_id=8, guest_id=6, check_in=today + timedelta(days=1), check_out=today + timedelta(days=3), guests=2, status="CONFIRMED", total_price=7360, created_at=datetime.utcnow() - timedelta(days=1)),
            Booking(id=9, listing_id=11, guest_id=5, check_in=today + timedelta(days=7), check_out=today + timedelta(days=10), guests=2, status="CONFIRMED", total_price=23460, created_at=datetime.utcnow() - timedelta(days=2)),
            
            # Host 4 (David) Bookings
            Booking(id=10, listing_id=5, guest_id=8, check_in=today - timedelta(days=8), check_out=today - timedelta(days=4), guests=4, status="COMPLETED", total_price=28520, created_at=datetime.utcnow() - timedelta(days=14)),
            Booking(id=11, listing_id=6, guest_id=7, check_in=today + timedelta(days=12), check_out=today + timedelta(days=15), guests=2, status="CONFIRMED", total_price=32430, created_at=datetime.utcnow() - timedelta(days=4)),
            Booking(id=12, listing_id=12, guest_id=6, check_in=today - timedelta(days=18), check_out=today - timedelta(days=14), guests=3, status="COMPLETED", total_price=23920, created_at=datetime.utcnow() - timedelta(days=25))
        ]

        # Seed historical booking snapshots with exactly the same authoritative pricing
        # calculation used by the booking service.
        listing_prices = {listing.id: listing.price_per_night for listing in db.query(Listing).all()}
        for booking in bookings_data:
            quote = calculate_price_breakdown(listing_prices[booking.listing_id], booking.check_in, booking.check_out)
            booking.price_per_night = quote.price_per_night
            booking.cleaning_fee = quote.cleaning_fee
            booking.service_fee = quote.service_fee
            booking.total_price = quote.total_price

        db.add_all(bookings_data)
        db.flush()

        reviews_data = [
            Review(id=1, listing_id=1, user_id=1, booking_id=1, rating=5, comment="Unbelievable experience! The pool overlooking Candolim beach was heavenly. Sarah was an exceptional host.", created_at=datetime.utcnow() - timedelta(days=14)),
            Review(id=2, listing_id=2, user_id=5, booking_id=2, rating=5, comment="The architectural beauty of this Haveli blew us away. Clean, hospitable, and serene rooftop lounge.", created_at=datetime.utcnow() - timedelta(days=6)),
            Review(id=3, listing_id=4, user_id=7, booking_id=7, rating=5, comment="Spectacular sunset views over the Arabian sea. High quality amenities and super responsive host Rahul!", created_at=datetime.utcnow() - timedelta(days=11)),
            Review(id=4, listing_id=5, user_id=8, booking_id=10, rating=5, comment="Living right on the backwaters in Alleppey was magical. Highly recommended!", created_at=datetime.utcnow() - timedelta(days=3))
        ]
        db.add_all(reviews_data)

        # Wishlists
        w1 = Wishlist(user_id=1, listing_id=1)
        w2 = Wishlist(user_id=1, listing_id=3)
        w3 = Wishlist(user_id=5, listing_id=2)
        db.add_all([w1, w2, w3])

        db.commit()
        print("Database successfully seeded with realistic Indian properties, users, bookings, and reviews!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
