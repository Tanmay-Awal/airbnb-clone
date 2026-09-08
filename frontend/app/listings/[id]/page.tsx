'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  Star,
  Share2,
  Heart,
  Grid,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Calendar,
  Users,
  ShieldCheck,
  Key,
  MapPin,
  Sparkles,
  Minus,
  Plus,
  Wifi,
  Utensils,
  Car,
  Wind,
  Laptop,
  Tv,
  Coffee,
  Waves,
  BedDouble,
  Award,
  ChevronDown
} from 'lucide-react';
import { ListingDetail, PriceBreakdown, Review } from '@/types';
import {
  apiGetListingDetail,
  apiCheckAvailability,
  apiCreateBooking,
  apiAddToWishlist,
  apiRemoveFromWishlist,
  apiGetReviews,
  apiGetWishlist,
  apiDeleteListing
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/components/Toast';
import { EditListingModal } from '@/components/EditListingModal';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, currentUser, setShowLoginModal } = useAuth();
  const { formatPrice } = useLocale();
  const { showToast } = useToast();

  const listingId = parseInt(params.id as string, 10);

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);

  // Reservation widget state
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [priceQuote, setPriceQuote] = useState<PriceBreakdown | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);
  const [isReserving, setIsReserving] = useState<boolean>(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isGuestsOpen, setIsGuestsOpen] = useState<boolean>(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Calendar Modal Animation state
  const [isCalendarRendered, setIsCalendarRendered] = useState<boolean>(false);
  const [isCalendarVisible, setIsCalendarVisible] = useState<boolean>(false);

  // Dynamic Calendar Month Navigation state (Default to Sept 2026)
  const [calendarBaseDate, setCalendarBaseDate] = useState<Date>(() => new Date(2026, 8, 1));

  const handlePrevMonth = () => {
    setCalendarBaseDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarBaseDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const isPrevDisabled = calendarBaseDate.getFullYear() < 2026 || (calendarBaseDate.getFullYear() === 2026 && calendarBaseDate.getMonth() <= 8);

  const m1Year = calendarBaseDate.getFullYear();
  const m1Month = calendarBaseDate.getMonth();
  const m2Date = new Date(m1Year, m1Month + 1, 1);
  const m2Year = m2Date.getFullYear();
  const m2Month = m2Date.getMonth();

  const renderMonthGrid = (year: number, month: number) => {
    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const firstDay = monthDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD in IST

    return (
      <div>
        <div className="font-bold text-center text-sm text-airbnb-black dark:text-white mb-3 h-6 flex items-center justify-center">
          {monthName}
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-airbnb-grey dark:text-gray-400 mb-2">
          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs font-semibold min-h-[192px]">
          {[...Array(firstDay)].map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const monthStr = (month + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const dateStr = `${year}-${monthStr}-${dayStr}`;
            const isPast = dateStr < todayStr;
            const isSelected = checkIn === dateStr || checkOut === dateStr;
            const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => {
                  if (isPast) return;
                  if (!checkIn || (checkIn && checkOut)) {
                    setCheckIn(dateStr);
                    setCheckOut('');
                  } else if (dateStr > checkIn) {
                    setCheckOut(dateStr);
                  } else {
                    setCheckIn(dateStr);
                  }
                }}
                className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center transition-all ${
                  isPast
                    ? 'text-gray-300 dark:text-gray-600 line-through cursor-not-allowed opacity-30 pointer-events-none'
                    : isSelected
                    ? 'bg-black dark:bg-white text-white dark:text-black font-bold cursor-pointer'
                    : isInRange
                    ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-none w-full cursor-pointer'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-airbnb-black dark:text-white cursor-pointer'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // About Modal Animation state
  const [isAboutRendered, setIsAboutRendered] = useState<boolean>(false);
  const [isAboutVisible, setIsAboutVisible] = useState<boolean>(false);

  useEffect(() => {
    if (isCalendarModalOpen) {
      setIsCalendarRendered(true);
      const timer = setTimeout(() => setIsCalendarVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsCalendarVisible(false);
      const timer = setTimeout(() => setIsCalendarRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isCalendarModalOpen]);

  useEffect(() => {
    if (isAboutModalOpen) {
      setIsAboutRendered(true);
      const timer = setTimeout(() => setIsAboutVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsAboutVisible(false);
      const timer = setTimeout(() => setIsAboutRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isAboutModalOpen]);

  // Prefill reservation details from URL searchParams (e.g. when clicking Change on checkout page)
  useEffect(() => {
    const urlCheckIn = searchParams?.get('checkIn') || '';
    const urlCheckOut = searchParams?.get('checkOut') || '';
    const urlGuests = Number(searchParams?.get('guests'));
    const openCalendar = searchParams?.get('openCalendar') === 'true';
    const openGuests = searchParams?.get('openGuests') === 'true';

    if (urlCheckIn) {
      setCheckIn(urlCheckIn);
      const d = new Date(urlCheckIn);
      if (!isNaN(d.getTime())) {
        setCalendarBaseDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
    if (urlCheckOut) {
      setCheckOut(urlCheckOut);
    }
    if (urlGuests && !isNaN(urlGuests)) {
      setGuests(urlGuests);
    }
    if (openCalendar) {
      setIsCalendarModalOpen(true);
    }
    if (openGuests) {
      setIsGuestsOpen(true);
    }
  }, [searchParams]);

  // Load listing details
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await apiGetListingDetail(listingId);
        setListing(data);

        // Load reviews
        try {
          const revs = await apiGetReviews(listingId);
          setReviews(revs.items);
        } catch (_) {}

        // Check initial wishlist state
        if (currentUser) {
          try {
            const wishlists = await apiGetWishlist(currentUser.id);
            setIsWishlisted(wishlists.some((w) => w.listing_id === listingId));
          } catch (_) {}
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load listing details', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    if (listingId) loadData();
  }, [listingId, currentUser]);

  // Live availability and price breakdown check when dates change
  useEffect(() => {
    async function updateQuote() {
      if (checkIn && checkOut && checkIn < checkOut && listing) {
        setIsCheckingAvailability(true);
        setAvailabilityMessage(null);
        try {
          const res = await apiCheckAvailability(listingId, checkIn, checkOut);
          if (res.available && res.price_breakdown) {
            setPriceQuote(res.price_breakdown);
          } else {
            setPriceQuote(null);
            setAvailabilityMessage(res.reason || 'Dates unavailable');
          }
        } catch (err: any) {
          setPriceQuote(null);
          setAvailabilityMessage(err.message || 'Error checking availability');
        } finally {
          setIsCheckingAvailability(false);
        }
      } else {
        setPriceQuote(null);
        setAvailabilityMessage(null);
      }
    }
    updateQuote();
  }, [checkIn, checkOut, listingId, listing]);

  const handleToggleWishlist = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in to add listings to your wishlist', 'info');
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    try {
      if (nextState) {
        await apiAddToWishlist(listingId, currentUser?.id);
        showToast('Saved to Wishlist', 'success');
      } else {
        await apiRemoveFromWishlist(listingId, currentUser?.id);
        showToast('Removed from Wishlist', 'info');
      }
    } catch (err: any) {
      setIsWishlisted(!nextState);
      showToast(err.message || 'Failed to update wishlist', 'error');
    }
  };

  const handleReserve = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in to complete your reservation', 'info');
      return;
    }

    if (!checkIn || !checkOut) {
      showToast('Please select valid check-in and check-out dates', 'error');
      return;
    }
    if (checkIn >= checkOut) {
      showToast('Check-out must be after check-in', 'error');
      return;
    }

    // Redirect to the Confirm and Pay checkout page matching Airbnb standard flow
    router.push(`/book/${listingId}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title || 'Airbnb Listing',
          text: `Check out this listing on Airbnb: ${listing?.title || ''}`,
          url: url
        });
        showToast('Shared successfully!', 'success');
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(url);
    showToast('Listing link copied to clipboard!', 'success');
  };

  const handleRemoveListing = async () => {
    if (!listing) return;
    if (!confirm(`Are you sure you want to remove "${listing.title}"? It will be unpublished and hidden from all travellers.`)) return;
    try {
      await apiDeleteListing(listing.id, currentUser?.id);
      showToast('Listing removed successfully', 'success');
      router.push('/hosting');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove listing', 'error');
    }
  };

  if (isLoading || !listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">
        <Navbar />
        <div className="max-w-[1120px] mx-auto w-full px-6 py-12 animate-pulse space-y-6">
          <div className="h-8 w-2/3 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-[420px] w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            </div>
            <div className="h-[350px] bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = listing.images && listing.images.length > 0
    ? listing.images.map((img: any) => img.image_url || img.url)
    : [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      ];


  // Description section rendering with Show More button
  const descriptionParagraphs = listing.description ? listing.description.split('\n\n') : [];
  const previewDescription = descriptionParagraphs.slice(0, 3).join('\n\n');

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">

      <Navbar />

      <main className="max-w-[1120px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
        {/* Host Control Bar when Host views their own listing */}
        {currentUser?.id === listing.host_id && (
          <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="font-extrabold text-sm text-airbnb-black flex items-center gap-2">
                <span>🏡 You are hosting this listing</span>
                <span className="text-[10px] uppercase font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 font-medium">Manage your listing settings, edit details, or remove it from Airbnb.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={handleRemoveListing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Remove listing
              </button>
            </div>
          </div>
        )}

        {/* Title Header */}
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-airbnb-black dark:text-white">{listing.title}</h1>
          <div className="flex items-center justify-between text-sm text-airbnb-black dark:text-gray-200 font-semibold">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-airbnb-black dark:fill-white text-airbnb-black dark:text-white" />
                <span>{listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}</span>
              </div>
              <span>·</span>
              <span className="underline cursor-pointer">{listing.review_count} reviews</span>
              <span>·</span>
              <span className="flex items-center gap-1 underline text-airbnb-grey dark:text-gray-400 font-normal cursor-pointer">
                <MapPin className="w-3.5 h-3.5" />
                {listing.location}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 hover:bg-airbnb-lightGrey dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
              >
                <Share2 className="w-4 h-4" />
                <span className="underline">Share</span>
              </button>
              <button
                onClick={handleToggleWishlist}
                className="flex items-center gap-2 hover:bg-airbnb-lightGrey dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-airbnb-red text-airbnb-red' : ''}`} />
                <span className="underline">{isWishlisted ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5-Photo Airbnb Gallery Grid */}
        <div className="relative rounded-2xl overflow-hidden mb-10 h-[300px] sm:h-[440px] grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Main Hero Photo (50% width) */}
          <div className="md:col-span-2 h-full relative cursor-pointer group" onClick={() => setIsGalleryOpen(true)}>
            <img
              src={galleryImages[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:brightness-95 transition-all"
            />
          </div>

          {/* Right 4 Grid Photos */}
          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
            {galleryImages.slice(1, 5).map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative h-full cursor-pointer group overflow-hidden"
                onClick={() => setIsGalleryOpen(true)}
              >
                <img
                  src={imgUrl}
                  alt={`${listing.title} ${idx + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>

        </div>



        {/* 2-Column Body Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-b border-airbnb-border dark:border-gray-800 pb-12">
          {/* Left Column (65%) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Host Overview */}
            <div className="flex items-center justify-between border-b border-airbnb-border dark:border-gray-800 pb-6">
              <div>
                <h2 className="text-xl font-bold text-airbnb-black dark:text-white">
                  {listing.property_type} hosted by {listing.host?.name || 'Superhost'}
                </h2>
                <div className="text-airbnb-grey dark:text-gray-400 text-sm mt-1">
                  {listing.max_guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} bathrooms
                </div>
              </div>
              <img
                src={listing.host?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                alt={listing.host?.name || 'Host'}
                className="w-14 h-14 rounded-full object-cover border border-airbnb-border dark:border-gray-700"
              />
            </div>

            {/* Highlights */}
            <div className="flex flex-col gap-5 border-b border-airbnb-border dark:border-gray-800 pb-6">
              <div className="flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-airbnb-black dark:text-white mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm text-airbnb-black dark:text-white">Self check-in</div>
                  <div className="text-xs text-airbnb-grey dark:text-gray-400">Check yourself in with the keypad or smart lock.</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-airbnb-black dark:text-white mt-1 flex-shrink-0" />
                <div>
                  <div className="font-bold text-sm text-airbnb-black dark:text-white">Dedicated workspace</div>
                  <div className="text-xs text-airbnb-grey dark:text-gray-400">A quiet room with high-speed WiFi for remote work.</div>
                </div>
              </div>
            </div>

            {/* Description Section with Show More Button */}
            <div className="border-b border-airbnb-border dark:border-gray-800 pb-6">
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-3">About this space</h3>
              <p className="text-airbnb-black dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line line-clamp-4">
                {previewDescription}...
              </p>
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="mt-4 bg-[#EBEBEB] dark:bg-gray-800 hover:bg-[#DDDDDD] dark:hover:bg-gray-700 text-airbnb-black dark:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Show more
              </button>
            </div>

            {/* Where you'll sleep Carousel Section */}
            <div className="border-b border-airbnb-border dark:border-gray-800 pb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-airbnb-black dark:text-white">Where you'll sleep</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-airbnb-grey dark:text-gray-400">
                  <span>1 / 2</span>
                  <button className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-airbnb-border dark:border-gray-800 rounded-2xl overflow-hidden p-4 flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-[#1A1A1A]">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={galleryImages[1] || galleryImages[0]}
                      alt="Bedroom 1"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-base text-airbnb-black dark:text-white">Bedroom 1</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">1 queen bed, 1 floor mattress</div>
                  </div>
                </div>

                <div className="border border-airbnb-border dark:border-gray-800 rounded-2xl overflow-hidden p-4 flex flex-col gap-3 group cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-[#1A1A1A]">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={galleryImages[2] || galleryImages[0]}
                      alt="Bedroom 2"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-base text-airbnb-black dark:text-white">Bedroom 2</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">1 queen bed, 1 floor mattress</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities Grid with Relevant Icons */}
            <div className="border-b border-airbnb-border dark:border-gray-800 pb-6">
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-4">
                {listing.amenities.map((amenity) => {
                  const nameLower = amenity.name.toLowerCase();
                  let IconComponent = Check;
                  if (nameLower.includes('wifi')) IconComponent = Wifi;
                  else if (nameLower.includes('kitchen')) IconComponent = Utensils;
                  else if (nameLower.includes('parking')) IconComponent = Car;
                  else if (nameLower.includes('air') || nameLower.includes('ac')) IconComponent = Wind;
                  else if (nameLower.includes('workspace')) IconComponent = Laptop;
                  else if (nameLower.includes('tv')) IconComponent = Tv;
                  else if (nameLower.includes('breakfast')) IconComponent = Coffee;
                  else if (nameLower.includes('pool')) IconComponent = Waves;

                  return (
                    <div key={amenity.id} className="flex items-center gap-3 text-sm text-airbnb-black dark:text-gray-200 font-medium">
                      <IconComponent className="w-5 h-5 text-airbnb-black dark:text-gray-200 stroke-[1.8]" />
                      <span>{amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Meet Your Host Section */}
            <div className="border-b border-airbnb-border dark:border-gray-800 pb-8">
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-6">Meet your Host</h3>
              
              <div className="bg-[#F7F7F7] dark:bg-[#262626] rounded-3xl p-6 border border-airbnb-border dark:border-gray-800 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={listing.host?.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                    alt={listing.host?.name || 'Host'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                  />
                  <div>
                    <div className="text-xl font-bold text-airbnb-black dark:text-white">{listing.host?.name || 'Superhost'}</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Award className="w-4 h-4 text-rose-500" />
                      <span>Superhost · 3 years hosting</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center text-xs font-semibold">
                  <div>
                    <div className="text-lg font-extrabold text-airbnb-black dark:text-white">128</div>
                    <div className="text-airbnb-grey dark:text-gray-400">Reviews</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                  <div>
                    <div className="text-lg font-extrabold text-airbnb-black dark:text-white">4.92 ★</div>
                    <div className="text-airbnb-grey dark:text-gray-400">Rating</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-700" />
                  <div>
                    <div className="text-lg font-extrabold text-airbnb-black dark:text-white">99%</div>
                    <div className="text-airbnb-grey dark:text-gray-400">Response rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Page Select Check-in Date Section */}
            <div className="pt-8 border-t border-airbnb-border dark:border-gray-800">
              <h3 className="text-xl font-bold text-airbnb-black dark:text-white mb-1">
                {checkIn && checkOut ? `${priceQuote?.nights || 2} nights in ${listing.location.split(',')[0]}` : 'Select check-in date'}
              </h3>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 mb-6">
                {checkIn && checkOut ? `${checkIn} – ${checkOut}` : 'Add your travel dates for exact pricing'}
              </p>

              {/* Dual Month Inline Grid View */}
              <div className="relative bg-gray-50/50 dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
                {/* Month Navigation Arrows */}
                <div className="flex items-center justify-between absolute top-5 left-6 right-6 z-10 pointer-events-none">
                  <button
                    disabled={isPrevDisabled}
                    onClick={handlePrevMonth}
                    className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 pointer-events-auto transition-colors ${
                      isPrevDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer text-black dark:text-white'
                    }`}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5 text-airbnb-black dark:text-white" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 pointer-events-auto cursor-pointer transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5 text-airbnb-black dark:text-white" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {renderMonthGrid(m1Year, m1Month)}
                  {renderMonthGrid(m2Year, m2Month)}
                </div>
              </div>


              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => {
                    setCheckIn('');
                    setCheckOut('');
                  }}
                  className="text-xs font-bold text-airbnb-black dark:text-white underline cursor-pointer hover:opacity-80"
                >
                  Clear dates
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (35% Sticky Booking Widget) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-airbnb-border dark:border-gray-800 p-6 shadow-airbnb-card flex flex-col gap-6">
              {/* Header Price */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-airbnb-black dark:text-white">
                    {formatPrice(listing.price_per_night)}
                  </span>
                  <span className="text-airbnb-grey dark:text-gray-400 text-sm font-normal"> / night</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-airbnb-black dark:text-white">
                  <Star className="w-4 h-4 fill-airbnb-black dark:fill-white text-airbnb-black dark:text-white" />
                  <span>{listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}</span>
                </div>
              </div>

              {/* Date & Guest Input Box */}
              <div className="border border-gray-400 dark:border-gray-700 rounded-xl overflow-visible relative">
                <div className="grid grid-cols-2 border-b border-gray-400 dark:border-gray-700">
                  <div
                    onClick={() => setIsCalendarModalOpen(!isCalendarModalOpen)}
                    className="p-3 border-r border-gray-400 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-airbnb-black dark:text-white cursor-pointer">CHECK-IN</label>
                    <div className="text-xs font-bold text-airbnb-black dark:text-white mt-0.5">
                      {checkIn ? checkIn : 'Add date'}
                    </div>
                  </div>
                  <div
                    onClick={() => setIsCalendarModalOpen(!isCalendarModalOpen)}
                    className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-airbnb-black dark:text-white cursor-pointer">CHECKOUT</label>
                    <div className="text-xs font-bold text-airbnb-black dark:text-white mt-0.5">
                      {checkOut ? checkOut : 'Add date'}
                    </div>
                  </div>
                </div>

                {/* Floating Interactive Dual-Month Calendar Dropdown Popover */}
                {isCalendarRendered && (
                  <div
                    className={`absolute right-full xl:right-[calc(100%+16px)] -top-14 bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-gray-800 z-[100] w-[320px] sm:w-[620px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-top-right ${
                      isCalendarVisible
                        ? 'opacity-100 scale-100 translate-x-0'
                        : 'opacity-0 scale-95 translate-x-4 pointer-events-none'
                    }`}
                  >

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-bold text-xl text-airbnb-black dark:text-white">
                          {checkIn && checkOut ? `${priceQuote?.nights || 2} nights` : 'Select dates'}
                        </div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">
                          {checkIn && checkOut ? `${checkIn} – ${checkOut}` : 'Add your travel dates for exact pricing'}
                        </div>
                      </div>

                      <button
                        onClick={() => setIsCalendarModalOpen(false)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Dual Month Calendar View */}
                    <div className="relative my-4">
                      {/* Month Navigation Arrows */}
                      <div className="flex items-center justify-between absolute top-0 left-0 right-0 z-10 pointer-events-none px-1">
                        <button
                          disabled={isPrevDisabled}
                          onClick={handlePrevMonth}
                          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 pointer-events-auto transition-colors ${
                            isPrevDisabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer text-black dark:text-white'
                          }`}
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-5 h-5 text-airbnb-black dark:text-white" />
                        </button>
                        <button
                          onClick={handleNextMonth}
                          className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 pointer-events-auto cursor-pointer transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-5 h-5 text-airbnb-black dark:text-white" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        {renderMonthGrid(m1Year, m1Month)}
                        {renderMonthGrid(m2Year, m2Month)}
                      </div>
                    </div>


                    <div className="flex items-center justify-between border-t border-airbnb-border dark:border-gray-800 pt-4 text-xs font-bold">
                      <button
                        onClick={() => {
                          setCheckIn('');
                          setCheckOut('');
                        }}
                        className="underline text-airbnb-black dark:text-white cursor-pointer hover:opacity-80"
                      >
                        Clear dates
                      </button>
                      <button
                        onClick={() => setIsCalendarModalOpen(false)}
                        className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl cursor-pointer hover:opacity-90 transition-opacity font-bold"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                )}

                {/* Guest Selector Dropdown */}
                <div className="relative p-3">
                  <button
                    onClick={() => setIsGuestsOpen(!isGuestsOpen)}
                    className="w-full text-left flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-airbnb-black dark:text-white">GUESTS</div>
                      <div className="text-xs font-semibold text-airbnb-black dark:text-white mt-0.5">
                        {guests} {guests === 1 ? 'guest' : 'guests'}
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-airbnb-grey dark:text-gray-300 transition-transform duration-200 ${isGuestsOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGuestsOpen && (
                    <>
                      {/* Click outside backdrop overlay */}
                      <div
                        onClick={() => setIsGuestsOpen(false)}
                        className="fixed inset-0 z-20"
                      />

                      <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#262626] border border-airbnb-border dark:border-gray-700 rounded-2xl p-4 shadow-xl z-30 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-airbnb-black dark:text-white">Guests</div>
                            <div className="text-[10px] text-airbnb-grey dark:text-gray-400">Max {listing.max_guests} guests</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setGuests(Math.max(1, guests - 1))}
                              disabled={guests <= 1}
                              className="w-7 h-7 rounded-full border border-airbnb-border dark:border-gray-600 text-airbnb-black dark:text-white flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-airbnb-black dark:text-white">{guests}</span>
                            <button
                              onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))}
                              disabled={guests >= listing.max_guests}
                              className="w-7 h-7 rounded-full border border-airbnb-border dark:border-gray-600 text-airbnb-black dark:text-white flex items-center justify-center disabled:opacity-30 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-airbnb-border dark:border-gray-700 pt-2">
                          <button
                            onClick={() => setIsGuestsOpen(false)}
                            className="text-xs font-bold text-airbnb-black dark:text-white underline cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Availability Alert */}
              {availabilityMessage && (
                <div className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 p-3 rounded-xl">
                  ⚠️ {availabilityMessage}
                </div>
              )}

              {/* Reserve Gradient Button */}
              <button
                onClick={handleReserve}
                disabled={Boolean(!checkIn || !checkOut || !guests || isReserving || isCheckingAvailability || !priceQuote)}
                className="w-full h-12 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-bold text-base rounded-xl hover:opacity-95 transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-md hover:shadow-lg disabled:shadow-none"
              >
                {isReserving ? 'Reserving...' : 'Reserve'}
              </button>

              <div className="text-center text-xs text-airbnb-grey dark:text-gray-400">You won't be charged yet</div>

              {/* Authoritative Price Calculation Line Items */}
              {priceQuote && (
                <div className="flex flex-col gap-3 pt-4 border-t border-airbnb-border dark:border-gray-800 text-sm text-airbnb-black dark:text-gray-200">
                  <div className="flex justify-between">
                    <span>{formatPrice(listing.price_per_night)} × {priceQuote.nights} nights</span>
                    <span>{formatPrice(priceQuote.base_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span>{formatPrice(priceQuote.cleaning_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Airbnb service fee (10%)</span>
                    <span>{formatPrice(priceQuote.service_fee)}</span>
                  </div>

                  <div className="border-t border-airbnb-border dark:border-gray-800 pt-3 flex justify-between font-bold text-base text-airbnb-black dark:text-white">
                    <span>Total before taxes</span>
                    <span>{formatPrice(priceQuote.total_price)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="py-12">
          <div className="flex items-center gap-2 text-xl font-bold text-airbnb-black dark:text-white mb-8">
            <Star className="w-6 h-6 fill-airbnb-black dark:fill-white text-airbnb-black dark:text-white" />
            <span>{listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}</span>
            <span>·</span>
            <span>{listing.review_count} reviews</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((rev) => (
              <div key={rev.id} className="flex flex-col gap-3 p-5 border border-airbnb-border dark:border-gray-800 rounded-2xl bg-white dark:bg-[#1A1A1A]">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={rev.user?.name || 'Guest'}
                    className="w-10 h-10 rounded-full object-cover border border-airbnb-border dark:border-gray-700"
                  />
                  <div>
                    <div className="font-bold text-sm text-airbnb-black dark:text-white">{rev.user?.name || 'Guest User'}</div>
                    <div className="text-xs text-airbnb-grey dark:text-gray-400">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Recently'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-airbnb-black dark:fill-white text-airbnb-black dark:text-white" />
                  ))}
                </div>
                <p className="text-xs text-airbnb-black dark:text-gray-200 leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* About this space Modal Popup with smooth two-way fade & zoom transitions */}
      {isAboutRendered && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-250 ease-out ${
            isAboutVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div
            className={`bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-gray-100 rounded-3xl p-8 max-w-[720px] w-full max-h-[85vh] overflow-y-auto shadow-2xl relative border border-airbnb-border dark:border-gray-800 transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
              isAboutVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsAboutModalOpen(false)}
              aria-label="Close"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer text-airbnb-black dark:text-white mb-4"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-airbnb-black dark:text-white mb-6">About this space</h2>

            <div className="text-airbnb-black dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line space-y-4 font-normal">
              {listing.description}
            </div>
          </div>
        </div>
      )}



      {/* Confirmation Modal */}
      {isConfirmationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-airbnb-modal animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎉
            </div>
            <h3 className="text-2xl font-bold text-airbnb-black mb-2">Reservation Confirmed!</h3>
            <p className="text-sm text-airbnb-grey mb-6">
              Your stay at <span className="font-semibold text-airbnb-black">{listing.title}</span> has been blocked and confirmed.
            </p>

            <div className="bg-airbnb-lightGrey p-4 rounded-2xl mb-6 text-left text-xs space-y-2">
              <div><span className="font-bold">Check-in:</span> {checkIn}</div>
              <div><span className="font-bold">Check-out:</span> {checkOut}</div>
              <div><span className="font-bold">Guests:</span> {guests}</div>
              {priceQuote && <div><span className="font-bold">Total Paid:</span> {formatPrice(priceQuote.total_price)}</div>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/trips')}
                className="flex-1 py-3 bg-airbnb-black text-white font-bold text-sm rounded-xl hover:bg-black transition-colors"
              >
                Go to My Trips
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      <EditListingModal
        isOpen={isEditing}
        listing={listing}
        onClose={() => setIsEditing(false)}
        onUpdated={(updated) => {
          setListing((prev: any) => ({ ...prev, ...updated }));
        }}
      />
    </div>
  );
}
