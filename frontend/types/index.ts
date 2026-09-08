export type UserRole = 'GUEST' | 'HOST';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface Amenity {
  id: number;
  name: string;
}

export interface ListingImage {
  id: number;
  url: string;
  position: number;
}

export interface ListingCard {
  id: number;
  title: string;
  location: string;
  property_type: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  cover_image?: string;
  images: string[];
  amenities?: string[];
  rating: number;
  review_count: number;
  host_name: string;
  status?: string;
  is_published?: boolean;
  created_at?: string;
}

export interface ListingDetail {
  id: number;
  host_id: number;
  host: User;
  title: string;
  description: string;
  property_type: string;
  location: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  latitude?: number;
  longitude?: number;
  images: ListingImage[];
  amenities: Amenity[];
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedListings {
  items: ListingCard[];
  page: number;
  limit: number;
  total: number;
  has_next: boolean;
}

export interface PriceBreakdown {
  nights: number;
  price_per_night: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
}

export interface AvailabilityResponse {
  available: boolean;
  reason?: string;
  price_breakdown?: PriceBreakdown;
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  total_price: number;
  created_at: string;
  listing?: {
    id: number;
    title: string;
    location: string;
    property_type?: string;
    cover_image?: string;
    price_per_night?: number;
  };
  guest?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  price_breakdown?: PriceBreakdown;
}

export interface Review {
  id: number;
  listing_id: number;
  user_id: number;
  booking_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: User;
}

export interface ReviewsList {
  items: Review[];
  average_rating: number;
  review_count: number;
}

export interface Wishlist {
  id: number;
  user_id: number;
  listing_id: number;
  created_at: string;
  listing: ListingCard;
}

export type Listing = ListingDetail;
export type PriceQuote = PriceBreakdown;

export interface SearchFilterParams {
  location?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  min_price?: number;
  max_price?: number;
  property_type?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
}
