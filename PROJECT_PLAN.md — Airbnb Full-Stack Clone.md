# Airbnb Web App — Full-Stack Assignment

## 1. Project Overview

We are building a functional **Airbnb-style full-stack web application** as an SDE Fullstack Assignment.

The application should replicate the core Airbnb experience:

- Browse property listings
- Search by location
- Search by dates
- Search by number of guests
- Filter listings
- View detailed property information
- Check availability
- Book a property
- View upcoming/past trips
- Add/remove properties from wishlist
- Leave reviews
- Act as a host
- Create, edit and delete listings
- View host bookings

The application should have a polished, modern, photo-focused UI inspired by Airbnb while remaining an independently implemented application.

The goal is **not simply to create static pages**.

The goal is to build a complete working system where:

```text
User
  ↓
Next.js Frontend
  ↓
FastAPI Backend
  ↓
SQLAlchemy
  ↓
SQLite Database
```

All important functionality should work end-to-end.

---

# 2. Assignment Requirements

## Frontend

Technology:

- Next.js
- TypeScript
- React
- Modern responsive UI

The frontend should provide:

### Home / Search

- Airbnb-style navbar
- Location search
- Date selection
- Guest selection
- Search button
- Property/category navigation
- Listing grid
- Listing cards
- Wishlist buttons
- Filters
- Pagination or infinite scrolling

Each listing card should display:

- Property image
- Property title
- Location
- Price per night
- Rating
- Optional dates/category information

---

## Listing Details

A listing detail page should contain:

- Image gallery
- Property title
- Location
- Rating
- Host information
- Description
- Amenities
- Property information
- Bedrooms
- Beds
- Bathrooms
- Maximum guests
- Availability
- Date picker
- Guest selector
- Price calculation
- Booking card
- Reviews

The booking card should clearly show:

```text
₹X × number of nights
Cleaning fee
Service fee
----------------
Total
```

The final price must ultimately be calculated and validated by the backend.

---

# 3. Booking System

Users should be able to select:

- Check-in date
- Check-out date
- Number of guests

The backend must validate:

### Date validation

- Check-in cannot be before today
- Check-out must be after check-in
- Number of nights must be greater than 0

### Guest validation

Requested guests cannot exceed:

```text
listing.max_guests
```

### Availability validation

A property cannot be booked if another confirmed booking overlaps.

The overlap condition is:

```text
existing.check_in < requested.check_out
AND
existing.check_out > requested.check_in
```

Adjacent bookings should be allowed.

Example:

```text
Booking A:
June 10 → June 15

Booking B:
June 15 → June 20
```

This is valid because the guest checks out on June 15 and the next guest checks in on June 15.

But:

```text
Booking A:
June 10 → June 15

Booking B:
June 14 → June 20
```

must be rejected.

---

# 4. Booking Price Calculation

The frontend may display an estimated price for user experience.

However, the backend must calculate the authoritative final price.

Example:

```text
number_of_nights = check_out - check_in

base_price =
    price_per_night * number_of_nights

cleaning_fee =
    configurable fixed/percentage amount

service_fee =
    configurable percentage

total =
    base_price + cleaning_fee + service_fee
```

The client must never be trusted to provide the final booking price.

The backend should recalculate the total before creating the booking.

---

# 5. Booking Confirmation

For this assignment, payment is mocked.

We do NOT need a real payment gateway.

The flow should be:

```text
Select dates
      ↓
Select guests
      ↓
Review price
      ↓
Reserve / Book
      ↓
Backend validates availability
      ↓
Booking created
      ↓
Confirmation screen
```

After successful booking:

- Booking should persist in SQLite
- Booking should appear in My Trips
- Dates should become unavailable
- Booking should contain total price
- User should receive success feedback/toast

---

# 6. My Trips

Users should have a Trips page.

Display:

### Upcoming trips

- Property
- Location
- Dates
- Guests
- Total price
- Booking status

### Past trips

Same information for completed bookings.

Users should be able to cancel eligible bookings.

Cancellation should update the booking status rather than deleting the database record.

Example statuses:

```text
CONFIRMED
CANCELLED
COMPLETED
```

---

# 7. Wishlist / Favorites

Users should be able to:

- Add a listing to wishlist
- Remove a listing
- View all wishlist listings

The database should prevent duplicate wishlist entries.

For example:

```text
unique(user_id, listing_id)
```

The wishlist button should provide immediate visual feedback.

---

# 8. Reviews

Users should be able to see reviews on listing pages.

A review contains:

- User
- Listing
- Booking
- Rating
- Comment
- Created date

Rating:

```text
1 → 5
```

A user should ideally only be allowed to review a property after a completed stay.

The booking relationship should be used to verify eligibility.

---

# 9. Host Functionality

The application must support the concept of hosts.

A host can:

- View their listings
- Create a listing
- Edit a listing
- Delete a listing
- View bookings for their listings

A host must NOT be able to modify another host's listing.

Authorization must be enforced on the backend.

---

# 10. Create Listing

Host listing creation should support:

### Basic information

- Title
- Description
- Location
- Property type

### Property information

- Maximum guests
- Bedrooms
- Beds
- Bathrooms

### Pricing

- Price per night

### Amenities

Examples:

- WiFi
- Kitchen
- Parking
- Air conditioning
- Pool
- TV
- Washing machine
- Workspace
- Heating

### Images

For this assignment, images can be represented using image URLs.

The schema should support multiple images per listing.

Each image should have an ordering/position.

---

# 11. Edit Listing

Hosts should be able to modify:

- Title
- Description
- Location
- Property type
- Price
- Guest capacity
- Bedrooms
- Beds
- Bathrooms
- Amenities
- Images

The existing listing should be loaded into the form.

---

# 12. Delete Listing

Hosts should be able to delete their own listings.

The backend must verify ownership before deletion.

Consider existing bookings when implementing deletion.

Prefer a safe approach rather than allowing deletion to corrupt historical booking data.

---

# 13. Host Dashboard

Create a host dashboard containing:

### Overview

- Total listings
- Total bookings
- Upcoming bookings
- Approximate revenue

### Listings

Show:

- Property image
- Property title
- Location
- Price
- Status
- Edit
- Delete

### Bookings

Show:

- Listing
- Guest
- Check-in
- Check-out
- Guests
- Amount
- Status

The dashboard does not need enterprise-level analytics.

The goal is to demonstrate a complete host workflow.

---

# 14. Search

The main listing endpoint should support search and filtering.

Conceptually:

```http
GET /api/listings
```

Possible parameters:

```text
location
check_in
check_out
guests
min_price
max_price
property_type
amenities
page
limit
```

Example:

```text
/api/listings?
location=Goa
&check_in=2026-10-10
&check_out=2026-10-15
&guests=4
&min_price=2000
&max_price=10000
&page=1
&limit=12
```

Search should be performed on the backend.

The frontend should not download every listing and filter everything locally.

---

# 15. Filtering

Support at minimum:

### Price

- Minimum price
- Maximum price

### Property type

Examples:

- Apartment
- House
- Villa
- Hotel
- Guesthouse
- Cabin

### Amenities

Examples:

- WiFi
- Pool
- Kitchen
- Parking
- Air conditioning

### Guests

Filter properties capable of accommodating the requested number of guests.

---

# 16. Pagination

Listing results must not load unlimited records at once.

Use pagination:

```text
page
limit
```

Example:

```text
page = 1
limit = 12
```

Response should contain enough metadata for the frontend to know whether more results exist.

Example conceptual response:

```json
{
  "items": [],
  "page": 1,
  "limit": 12,
  "total": 100,
  "has_next": true
}
```

---

# 17. User Roles

We will support two primary roles:

```text
GUEST
HOST
```

A user can browse listings and book properties as a guest.

A host can additionally manage their own listings and view bookings.

For the assignment, authentication can be lightweight/mock.

However:

**Authorization must still be real.**

For example:

```text
Host A
    ↓
PATCH /api/listings/10
```

must only succeed if listing 10 belongs to Host A.

---

# 18. Authentication Assumption

Real production authentication is outside the core assignment scope.

We can implement a lightweight demo authentication mechanism.

Possible approach:

- Seed demo users
- Select/login as a demo user
- Store the current user identity
- Send user identity with API requests

The exact implementation can be decided during backend implementation.

The architecture should nevertheless separate:

```text
Authentication
Authorization
Business Logic
Database Access
```

so real authentication could be introduced later without rewriting the entire application.

---

# 19. Database

## Database Technology

Use:

**SQLite**

Do not introduce PostgreSQL, MongoDB, Redis, or any other database.

SQLite is a deliberate assignment constraint.

Use:

- SQLAlchemy
- Alembic
- SQLite

The database should be properly normalized.

---

# 20. Database Schema

## users

```text
users
-----
id
name
email
role
avatar_url
created_at
```

Role:

```text
GUEST
HOST
```

---

## listings

```text
listings
--------
id
host_id
title
description
property_type
location
price_per_night
max_guests
bedrooms
beds
bathrooms
latitude
longitude
created_at
updated_at
```

Relationship:

```text
User 1 ─────── N Listings
```

A host owns many listings.

---

## listing_images

```text
listing_images
--------------
id
listing_id
url
position
```

Relationship:

```text
Listing 1 ─────── N Images
```

`position` determines gallery ordering.

---

## amenities

```text
amenities
---------
id
name
```

---

## listing_amenities

Many-to-many relationship:

```text
listing_amenities
-----------------
listing_id
amenity_id
```

Constraint:

```text
UNIQUE(listing_id, amenity_id)
```

---

## bookings

```text
bookings
--------
id
listing_id
guest_id
check_in
check_out
guests
status
total_price
created_at
```

Relationships:

```text
Listing 1 ─────── N Bookings

User 1 ─────── N Bookings
```

---

## reviews

```text
reviews
-------
id
listing_id
user_id
booking_id
rating
comment
created_at
```

The booking relationship allows us to verify that the reviewer actually stayed at the property.

---

## wishlists

```text
wishlists
---------
id
user_id
listing_id
created_at
```

Constraint:

```text
UNIQUE(user_id, listing_id)
```

---

# 21. Database Relationships

Overall relationship:

```text
                    ┌──────────────┐
                    │    USERS     │
                    └──────┬───────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
              hosts                guests
                 │                   │
                 ▼                   ▼
          ┌─────────────┐      ┌─────────────┐
          │  LISTINGS   │◄─────│  BOOKINGS   │
          └──────┬──────┘      └──────┬──────┘
                 │                    │
          ┌──────┴──────┐             │
          ▼             ▼             ▼
     ┌─────────┐   ┌───────────┐  ┌─────────┐
     │ IMAGES  │   │ AMENITIES │  │ REVIEWS │
     └─────────┘   └───────────┘  └─────────┘
```

Wishlist:

```text
USER
 │
 ▼
WISHLIST
 │
 ▼
LISTING
```

---

# 22. Important Database Indexes

Add indexes where they improve common queries.

Potential indexes:

```text
listings.host_id
listings.location
listings.property_type
bookings.listing_id
bookings.guest_id
bookings.check_in
bookings.check_out
reviews.listing_id
wishlists.user_id
```

Composite/unique constraints should be used where appropriate.

Do not add indexes blindly.

Each important index should correspond to an actual query pattern.

---

# 23. Backend Architecture

Use:

**FastAPI + SQLAlchemy + SQLite**

Recommended structure:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── wishlist.py
│   │
│   ├── schemas/
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── booking.py
│   │   ├── review.py
│   │   └── wishlist.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── listings.py
│   │   ├── bookings.py
│   │   ├── reviews.py
│   │   ├── wishlist.py
│   │   └── host.py
│   │
│   ├── services/
│   │   ├── listing_service.py
│   │   ├── booking_service.py
│   │   ├── review_service.py
│   │   └── pricing_service.py
│   │
│   └── utils/
│       └── ...
│
├── alembic/
│
├── seed/
│   └── seed.py
│
├── tests/
│
├── requirements.txt
├── alembic.ini
└── README.md
```

The exact structure can be adjusted if there is a better FastAPI convention, but the backend should remain modular.

---

# 24. Backend Layering

Avoid putting everything inside route handlers.

Prefer:

```text
API Router
    ↓
Schema Validation
    ↓
Service / Business Logic
    ↓
SQLAlchemy Models / Queries
    ↓
SQLite
```

Example:

```text
POST /api/bookings
        ↓
bookings.py
        ↓
booking_service.py
        ↓
validate dates
        ↓
check availability
        ↓
calculate price
        ↓
create booking
        ↓
database transaction
```

This makes the code easier to understand, test and extend.

---

# 25. API Design

## Users

```http
GET /api/me
```

Returns current demo user.

---

## Listings

```http
GET /api/listings
GET /api/listings/{listing_id}

POST /api/listings

PATCH /api/listings/{listing_id}

DELETE /api/listings/{listing_id}
```

---

## Host

```http
GET /api/host/listings
GET /api/host/bookings
```

---

## Bookings

```http
POST /api/bookings
GET /api/bookings
GET /api/bookings/{booking_id}
POST /api/bookings/{booking_id}/cancel
```

---

## Wishlist

```http
GET /api/wishlist
POST /api/wishlist/{listing_id}
DELETE /api/wishlist/{listing_id}
```

---

## Reviews

```http
GET /api/listings/{listing_id}/reviews
POST /api/listings/{listing_id}/reviews
```

---

# 26. API Error Handling

The API should return meaningful HTTP errors.

Examples:

```text
400 Bad Request
```

Invalid input.

```text
401 Unauthorized
```

User is not authenticated.

```text
403 Forbidden
```

User does not have permission.

```text
404 Not Found
```

Resource doesn't exist.

```text
409 Conflict
```

Resource state conflicts with requested operation.

A booking conflict is a good example:

```text
409 Conflict
Property is no longer available for the selected dates.
```

---

# 27. Booking Transaction

Booking creation is one of the most important backend operations.

Conceptually:

```text
BEGIN TRANSACTION

    Validate listing

    Validate guest count

    Validate dates

    Check overlapping bookings

    Calculate final price

    Create booking

COMMIT
```

If validation fails:

```text
ROLLBACK
```

No partial booking should remain.

The availability check must happen immediately before inserting the booking.

---

# 28. Frontend Architecture

Recommended structure:

```text
frontend/
│
├── app/
│   ├── page.tsx
│   │
│   ├── listings/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── trips/
│   │   └── page.tsx
│   │
│   ├── wishlist/
│   │   └── page.tsx
│   │
│   ├── host/
│   │   ├── page.tsx
│   │   ├── listings/
│   │   ├── bookings/
│   │   └── new/
│   │
│   └── ...
│
├── components/
│   ├── Navbar.tsx
│   ├── SearchBar.tsx
│   ├── CategoryBar.tsx
│   ├── ListingCard.tsx
│   ├── ListingGrid.tsx
│   ├── FilterModal.tsx
│   ├── DatePicker.tsx
│   ├── GuestSelector.tsx
│   ├── BookingCard.tsx
│   ├── ImageGallery.tsx
│   ├── Reviews.tsx
│   ├── Toast.tsx
│   └── ...
│
├── lib/
│   ├── api.ts
│   ├── constants.ts
│   └── utils.ts
│
├── hooks/
│   ├── useListings.ts
│   ├── useBooking.ts
│   └── ...
│
├── types/
│   ├── listing.ts
│   ├── booking.ts
│   ├── user.ts
│   └── ...
│
├── public/
│
├── package.json
└── README.md
```

---

# 29. Frontend UI Principles

The UI should feel like a modern Airbnb-style application.

Important characteristics:

- Clean
- Minimal
- Photo-focused
- Responsive
- Spacious
- Rounded cards
- Clear typography
- Strong hierarchy
- Smooth interactions
- Good hover states
- Good loading states
- Good empty states

Avoid:

- Generic dashboard-looking UI
- Excessive gradients
- Excessive glassmorphism
- Huge unnecessary animations
- Overly complicated navigation

The application should feel like a real product rather than a college CRUD project.

---

# 30. Responsive Design

The application must work on:

```text
Desktop
Tablet
Mobile
```

Important responsive areas:

- Navbar
- Search bar
- Listing grid
- Listing detail gallery
- Booking card
- Host dashboard
- Forms
- Filters

On mobile, layouts should adapt rather than simply shrink.

---

# 31. Loading / Error / Empty States

Every major data-fetching UI should account for:

### Loading

Skeletons or loading indicators.

### Error

Useful error message.

Example:

```text
Something went wrong while loading listings.
Try again.
```

### Empty

Example:

```text
No stays found.

Try changing your dates or filters.
```

These states are important for making the application feel complete.

---

# 32. Notifications

Use toast notifications for actions such as:

```text
Listing created successfully
Listing updated successfully
Listing deleted
Added to wishlist
Removed from wishlist
Booking confirmed
Booking cancelled
Review submitted
```

Errors should also be surfaced clearly.

---

# 33. Image Handling

For the assignment, actual cloud image uploading is optional.

The initial implementation can use image URLs.

The database should still be designed around:

```text
listing
    ↓
multiple listing_images
```

rather than storing one image string directly on the listing.

This allows future image-upload functionality without changing the core listing model.

---

# 34. Seed Data

The database must contain realistic demo data.

Seed:

### Users

At least:

- Multiple guests
- Multiple hosts

### Listings

At least:

```text
20–30 listings
```

Spread across locations such as:

- Goa
- Delhi
- Mumbai
- Bengaluru
- Jaipur
- Manali
- Udaipur
- Rishikesh
- Hyderabad
- Kerala

Listings should vary by:

- Price
- Property type
- Guest capacity
- Amenities
- Number of bedrooms
- Rating/reviews
- Images

### Bookings

Include several existing bookings so availability can be demonstrated.

### Reviews

Include reviews for several properties.

The seed data should make the application immediately usable after setup.

---

# 35. Security Requirements

Even though this is an assignment, do not treat the backend as trusted-client CRUD.

Important rules:

### Never trust frontend prices

Backend recalculates totals.

### Never trust frontend ownership

Backend verifies:

```text
current_user.id == listing.host_id
```

### Validate all inputs

Use Pydantic schemas.

### Prevent unauthorized access

Host-only operations must verify role.

### Validate booking dates

Do not allow invalid ranges.

### Validate guest count

Do not exceed listing capacity.

### Prevent duplicate wishlist entries

Use database constraints.

### Prevent overlapping bookings

Check on the backend.

---

# 36. Scalability / Performance Principles

We are intentionally using SQLite because it is part of the assignment.

We should still write the application in a production-minded way.

Important principles:

- Proper database normalization
- Proper indexes
- Pagination
- Avoid N+1 queries
- Avoid loading unnecessary columns/data
- Backend filtering
- Efficient availability queries
- Reusable services
- Transactions for critical operations
- Avoid unnecessary frontend API calls

Do not build unnecessary infrastructure.

Do NOT introduce:

- Microservices
- Kafka
- Kubernetes
- Elasticsearch
- Redis
- MongoDB
- Complex event-driven architecture

The assignment does not require them.

---

# 37. Caching

Caching is not required for the MVP.

Do not introduce a complex caching layer just to demonstrate knowledge.

Optimize the actual database queries first.

If needed later, caching can be discussed as a potential optimization, but it should not complicate the core assignment.

---

# 38. Out of Scope

The following are intentionally simplified or excluded:

### Real payments

Use mocked checkout.

### Real identity verification

Not required.

### Production-grade authentication

Lightweight/demo authentication is sufficient.

### Real-time messaging

Not required.

### Real host-guest chat

Not required.

### Cloud image upload

Optional bonus.

### Real map integration

Optional bonus.

### Advanced recommendation engine

Not required.

### Complex analytics

Not required.

---

# 39. Optional Bonus Features

Only implement these after the core system is stable.

Possible bonuses:

- Interactive map
- Dark mode
- Image cloud upload
- Completed-stay review restriction
- Superhost badge
- Advanced rating calculations
- More sophisticated animations
- Advanced search ranking
- Mobile-specific UX improvements

Never sacrifice core functionality for bonus features.

---

# 40. Project Root Structure

The final repository should look approximately like:

```text
airbnb-clone/
│
├── frontend/
│
├── backend/
│
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── REQUIREMENTS.md
│   ├── DATABASE_DESIGN.md
│   ├── API_DESIGN.md
│   └── CHECKPOINTS/
│
├── README.md
├── .gitignore
└── ...
```

The root README should explain:

- Project overview
- Features
- Tech stack
- Setup instructions
- Environment variables
- Database setup
- Seed instructions
- Running frontend
- Running backend
- API overview
- Architecture
- Assumptions
- Demo users

---

# 41. Development Order

Do NOT build the entire application randomly.

Follow this order.

## Phase 1 — Project Setup

Create:

```text
frontend/
backend/
docs/
```

Configure:

- Next.js
- TypeScript
- FastAPI
- SQLAlchemy
- SQLite
- Alembic
- Environment configuration
- CORS

---

## Phase 2 — Database

Implement:

- Models
- Relationships
- Constraints
- Indexes
- Alembic migrations
- Seed script

Verify database independently.

---

## Phase 3 — Backend Core

Implement:

1. Users/demo auth
2. Listings
3. Search/filtering
4. Listing details
5. Wishlist
6. Bookings
7. Host operations
8. Reviews

Test APIs independently.

---

## Phase 4 — Frontend Foundation

Implement:

- Layout
- Navbar
- Global styling
- API client
- Types
- Listing cards
- Listing grid
- Search UI

---

## Phase 5 — Main User Flow

Implement:

```text
Home
 ↓
Search
 ↓
Listing results
 ↓
Listing details
 ↓
Select dates
 ↓
Select guests
 ↓
Book
 ↓
Confirmation
 ↓
My Trips
```

This flow must work end-to-end before polishing.

---

## Phase 6 — Host Flow

Implement:

```text
Host Dashboard
 ↓
My Listings
 ↓
Create Listing
 ↓
Edit Listing
 ↓
Delete Listing
 ↓
View Bookings
```

---

## Phase 7 — Wishlist / Reviews

Implement:

```text
Wishlist
Reviews
```

---

## Phase 8 — UI Polish

Add:

- Animations
- Hover states
- Skeleton loading
- Toasts
- Empty states
- Error states
- Responsive improvements
- Image gallery polish
- Modal transitions

---

## Phase 9 — Testing

Test:

### Search

- Location
- Dates
- Guests
- Price
- Property type
- Amenities
- Pagination

### Booking

- Valid booking
- Invalid dates
- Invalid guests
- Overlapping booking
- Adjacent booking
- Cancellation

### Host

- Create
- Edit
- Delete
- Unauthorized modification

### Wishlist

- Add
- Remove
- Duplicate prevention

### Reviews

- Create
- Validation
- Listing review display

---

## Phase 10 — Deployment

Deploy:

```text
Frontend → Vercel/Netlify/etc.
Backend → Render/Railway/etc.
```

The exact provider can be chosen during deployment.

Make sure:

- Backend is reachable
- Frontend uses production API URL
- SQLite database is handled appropriately for the chosen deployment environment
- CORS is configured
- Seed data exists
- Application works from a fresh browser session

---

# 42. Definition of Done

The project is considered complete when a new user can:

```text
Open website
    ↓
Browse listings
    ↓
Search listings
    ↓
Apply filters
    ↓
Open listing
    ↓
Select dates
    ↓
Select guests
    ↓
See price breakdown
    ↓
Book property
    ↓
Receive confirmation
    ↓
See booking in My Trips
```

And a host can:

```text
Open host dashboard
    ↓
See listings
    ↓
Create listing
    ↓
Edit listing
    ↓
Delete listing
    ↓
See bookings
```

Additionally:

```text
Wishlist works
Reviews work
Availability works
Database persists data
Backend validates business rules
UI is responsive
Application is deployed
README is complete
```

---

# 43. Coding Standards

The coding agent should prioritize:

### Readability

Code should be easy for another developer to understand.

### Modularity

Avoid massive files.

### Reusability

Shared UI and backend logic should be extracted where appropriate.

### Type safety

Use TypeScript properly.

Use Pydantic schemas for API validation.

### Error handling

Handle expected errors explicitly.

### Naming

Use descriptive names.

Avoid:

```text
x
data2
temp
foo
```

when meaningful names are possible.

### Comments

Comments should explain **why**, not simply repeat what the code does.

---

# 44. Important Implementation Rule

Do not over-engineer this application.

The objective is:

> Build a complete, clean, understandable full-stack Airbnb clone within the assignment timeline.

A simple correct implementation is better than a complicated architecture that is unfinished.

Prioritize:

```text
Functionality
    >
Correctness
    >
Data integrity
    >
UI quality
    >
Performance
    >
Bonus features
```

---

# 45. AI Coding Agent Instructions

The coding agent should treat this document as the project's source of truth.

Before implementing a feature:

1. Understand the existing architecture.
2. Check whether the feature already has supporting models/APIs/components.
3. Reuse existing abstractions where appropriate.
4. Avoid creating duplicate logic.
5. Keep frontend and backend contracts synchronized.
6. Do not silently change the technology stack.
7. Do not introduce additional databases.
8. Do not remove required functionality.
9. Do not replace working functionality unnecessarily.
10. Keep the application runnable after each meaningful change.

When making architectural decisions that are not explicitly defined here, choose the **simplest production-minded solution**.

---

# 46. Current Technology Stack

## Frontend

```text
Next.js
TypeScript
React
```

## Backend

```text
Python
FastAPI
SQLAlchemy
Alembic
```

## Database

```text
SQLite
```

## Deployment

```text
Frontend → Vercel/Netlify/etc.
Backend → Render/Railway/etc.
```

---

# 47. Final Product Vision

The finished application should feel like:

> A real Airbnb-inspired booking platform rather than a collection of CRUD screens.

A user should be able to naturally discover a property, evaluate it, choose dates, understand the price, reserve it, and later manage the trip.

A host should be able to naturally manage their properties and bookings.

The system should demonstrate understanding of:

- Full-stack architecture
- REST APIs
- Database design
- Relational modeling
- Authentication concepts
- Authorization
- Validation
- Transactions
- Booking conflict detection
- Frontend state management
- API integration
- Responsive UI
- Error handling
- Testing
- Deployment

The implementation should remain simple enough that every major architectural and coding decision can be explained confidently in a technical interview.