'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SearchModal } from '@/components/SearchModal';
import { FilterModal } from '@/components/FilterModal';
import { CategorySectionRow } from '@/components/CategorySectionRow';
import { getSectionsForTab, SectionGroup } from '@/lib/categoriesData';
import { SearchFilterParams, Wishlist, ListingCard } from '@/types';
import { apiGetListings, apiGetWishlist, apiAddToWishlist, apiRemoveFromWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { Heart, Star, MapPinOff, Sparkles, RefreshCw } from 'lucide-react';

function HomePageContent() {
  const router = useRouter();
  const searchParamsFromUrl = useSearchParams();
  const { currentUser } = useAuth();
  const { formatPrice } = useLocale();

  const [activeTopTab, setActiveTopTab] = useState<'all' | 'homes' | 'experiences' | 'services'>('all');
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  
  // Search parameters state
  const [searchParams, setSearchParams] = useState<SearchFilterParams>({});
  const [searchResults, setSearchResults] = useState<ListingCard[] | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Parse search params strictly from URL on mount / change
  const urlLocation = searchParamsFromUrl.get('location') || undefined;
  const urlGuests = searchParamsFromUrl.get('guests') ? parseInt(searchParamsFromUrl.get('guests')!) : undefined;
  const urlCheckIn = searchParamsFromUrl.get('check_in') || undefined;
  const urlCheckOut = searchParamsFromUrl.get('check_out') || undefined;
  const urlMinPrice = searchParamsFromUrl.get('min_price') ? parseInt(searchParamsFromUrl.get('min_price')!) : undefined;
  const urlMaxPrice = searchParamsFromUrl.get('max_price') ? parseInt(searchParamsFromUrl.get('max_price')!) : undefined;
  const urlPropertyType = searchParamsFromUrl.get('property_type') || undefined;

  const hasActiveSearch = Boolean(
    urlLocation || urlGuests || urlCheckIn || urlCheckOut || urlMinPrice || urlMaxPrice || urlPropertyType
  );

  // Sync state strictly with URL params
  useEffect(() => {
    const combinedParams: SearchFilterParams = {
      location: urlLocation,
      guests: urlGuests,
      check_in: urlCheckIn,
      check_out: urlCheckOut,
      min_price: urlMinPrice,
      max_price: urlMaxPrice,
      property_type: urlPropertyType,
      page: 1,
      limit: 40,
    };

    setSearchParams(combinedParams);
  }, [urlLocation, urlGuests, urlCheckIn, urlCheckOut, urlMinPrice, urlMaxPrice, urlPropertyType]);

  // Fetch search results whenever URL search params change
  useEffect(() => {
    if (!hasActiveSearch) {
      setSearchResults(null);
      return;
    }

    async function fetchSearchListings() {
      setIsLoadingSearch(true);
      try {
        const queryParamsToSend: SearchFilterParams = {
          location: urlLocation,
          guests: urlGuests,
          check_in: urlCheckIn,
          check_out: urlCheckOut,
          min_price: urlMinPrice,
          max_price: urlMaxPrice,
          property_type: urlPropertyType,
          limit: 50,
        };

        const response = await apiGetListings(queryParamsToSend);
        setSearchResults(response.items || []);
      } catch (err) {
        console.error('Error fetching search listings:', err);
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }

    fetchSearchListings();
  }, [urlLocation, urlGuests, urlCheckIn, urlCheckOut, urlMinPrice, urlMaxPrice, urlPropertyType, hasActiveSearch]);

  // Load wishlist for current user
  useEffect(() => {
    async function loadWishlist() {
      if (!currentUser) return;
      try {
        const wishlists: Wishlist[] = await apiGetWishlist(currentUser.id);
        setWishlistIds(wishlists.map((w) => w.listing_id));
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    }
    loadWishlist();
  }, [currentUser]);

  const handleTopTabChange = (tab: 'all' | 'homes' | 'experiences' | 'services') => {
    setActiveTopTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplySearch = (params: { location?: string; check_in?: string; check_out?: string; guests?: number }) => {
    const query = new URLSearchParams();
    if (params.location) query.set('location', params.location);
    if (params.guests) query.set('guests', params.guests.toString());
    if (params.check_in) query.set('check_in', params.check_in);
    if (params.check_out) query.set('check_out', params.check_out);

    router.push(`/${query.toString() ? '?' + query.toString() : ''}`);
  };

  const handleApplyFilters = (filters: { min_price?: number; max_price?: number; property_type?: string; amenities?: string[] }) => {
    const query = new URLSearchParams(searchParamsFromUrl.toString());
    if (filters.min_price !== undefined) query.set('min_price', filters.min_price.toString());
    if (filters.max_price !== undefined) query.set('max_price', filters.max_price.toString());
    if (filters.property_type) query.set('property_type', filters.property_type);

    router.push(`/${query.toString() ? '?' + query.toString() : ''}`);
  };

  const handleWishlistToggle = async (itemId: number, currentStatus: boolean) => {
    if (currentStatus) {
      setWishlistIds((prev) => prev.filter((id) => id !== itemId));
      if (currentUser) {
        try {
          await apiRemoveFromWishlist(itemId, currentUser.id);
        } catch (_) {}
      }
    } else {
      setWishlistIds((prev) => [...prev, itemId]);
      if (currentUser) {
        try {
          await apiAddToWishlist(itemId, currentUser.id);
        } catch (_) {}
      }
    }
  };

  const handleClearSearch = () => {
    setSearchParams({});
    setSearchResults(null);
    router.push('/');
  };

  const sectionsToDisplay: SectionGroup[] = getSectionsForTab(activeTopTab);
  const activeLocation = urlLocation || searchParams.location;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#1A1A1A] transition-colors duration-200">
      {/* Navbar Header */}
      <Navbar
        activeTopTab={activeTopTab}
        onTopTabChange={handleTopTabChange}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        locationFilter={activeLocation}
        guestsFilter={urlGuests || searchParams.guests}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1760px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8">
        {/* IF SEARCH IS ACTIVE */}
        {hasActiveSearch ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Search Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-airbnb-border dark:border-gray-800">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-airbnb-black dark:text-white tracking-tight">
                  {activeLocation ? `Stays in ${activeLocation}` : 'Search Results'}
                </h1>
                <p className="text-sm text-airbnb-grey dark:text-gray-400 mt-1 font-medium">
                  {isLoadingSearch
                    ? 'Searching places in database...'
                    : searchResults !== null
                    ? `Found ${searchResults.length} ${searchResults.length === 1 ? 'place' : 'places'}`
                    : 'Searching places...'}
                  {(urlGuests || searchParams.guests) && ` • ${urlGuests || searchParams.guests} guests`}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="px-4 py-2 rounded-full border border-airbnb-border dark:border-gray-700 text-xs font-bold text-airbnb-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Filters</span>
                </button>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-airbnb-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>
            </div>

            {/* LOADING STATE */}
            {isLoadingSearch ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3 animate-pulse">
                    <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              /* SEARCH RESULTS GRID */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-2">
                {searchResults.map((item) => {
                  const isWishlisted = wishlistIds.includes(item.id);
                  const imageSrc = item.cover_image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

                  return (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/listings/${item.id}`)}
                      className="flex flex-col gap-2 group cursor-pointer"
                    >
                      {/* Image Card */}
                      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={imageSrc}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(item.id, isWishlisted);
                          }}
                          aria-label="Wishlist"
                          className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Heart
                            className={`w-5 h-5 transition-colors ${
                              isWishlisted
                                ? 'fill-airbnb-red text-airbnb-red'
                                : 'text-white fill-black/30 stroke-[2]'
                            }`}
                          />
                        </button>
                        <div className="absolute top-3 left-3 bg-white/95 dark:bg-black/90 text-airbnb-black dark:text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
                          {item.property_type || 'Villa'}
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="flex flex-col gap-1 text-sm mt-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-airbnb-black dark:text-white truncate">
                            {item.title}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0 text-xs font-bold text-airbnb-black dark:text-white">
                            <Star className="w-3.5 h-3.5 fill-black dark:fill-white text-black dark:text-white" />
                            <span>{(item.rating || 4.9).toFixed(1)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-airbnb-grey dark:text-gray-400 truncate">
                          {item.location}
                        </span>
                        <div className="text-xs text-airbnb-black dark:text-gray-200 mt-0.5">
                          <span className="font-bold">{formatPrice(item.price_per_night || 5000)}</span> / night
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY STATE WHEN NO PLACES FOUND */
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center my-8 bg-gray-50 dark:bg-[#222222] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 text-airbnb-red flex items-center justify-center mb-6 shadow-sm">
                  <MapPinOff className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h3 className="text-2xl font-bold text-airbnb-black dark:text-white mb-2">
                  No places found
                </h3>
                <p className="text-sm text-airbnb-grey dark:text-gray-400 max-w-md mb-8 leading-relaxed">
                  We couldn't find any places matching <span className="font-bold text-airbnb-black dark:text-white">"{activeLocation || 'your criteria'}"</span>.
                  Try searching for destinations like <span className="font-semibold text-airbnb-black dark:text-white underline">Gurgaon</span>, <span className="font-semibold text-airbnb-black dark:text-white underline">Delhi</span>, <span className="font-semibold text-airbnb-black dark:text-white underline">Goa</span>, or <span className="font-semibold text-airbnb-black dark:text-white underline">Varanasi</span>.
                </p>
                <button
                  onClick={handleClearSearch}
                  className="px-8 py-3.5 bg-airbnb-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-full hover:scale-105 transition-all shadow-md cursor-pointer"
                >
                  Clear search & view all stays
                </button>
              </div>
            )}
          </div>
        ) : (
          /* DEFAULT HOMEPAGE CATEGORY ROWS */
          <div key={activeTopTab} className="flex flex-col gap-12 animate-tab-switch">
            {sectionsToDisplay.map((section) => (
              <CategorySectionRow
                key={section.id}
                section={section}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSearch={handleApplySearch}
        initialLocation={activeLocation}
        initialCheckIn={urlCheckIn || searchParams.check_in}
        initialCheckOut={urlCheckOut || searchParams.check_out}
        initialGuests={urlGuests || searchParams.guests}
      />

      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialMinPrice={urlMinPrice || searchParams.min_price}
        initialMaxPrice={urlMaxPrice || searchParams.max_price}
        initialPropertyType={urlPropertyType || searchParams.property_type}
        initialAmenities={searchParams.amenities}
        availableListings={searchResults || undefined}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm font-bold">Loading stays...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

