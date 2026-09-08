'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Star, SlidersHorizontal, Plus, Minus, MapPin, Check, ChevronLeft, ChevronRight, MapPinOff, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { SectionGroup, ListingItem } from '@/lib/categoriesData';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { FilterModal } from '@/components/FilterModal';
import { ListingCard } from '@/types';
import { useLocale } from '@/context/LocaleContext';

const LeafletMapComponent = dynamic(() => import('./LeafletMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#e5e3df] flex items-center justify-center font-bold text-gray-500 text-sm">
      Loading interactive map...
    </div>
  ),
});

interface SplitMapSearchProps {
  section: SectionGroup;
}

export const SplitMapSearch: React.FC<SplitMapSearchProps> = ({ section }) => {
  const router = useRouter();
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useLocale();

  const formatItemPriceText = (priceText: string) => {
    return priceText.replace(/₹\s*([\d,]+)/g, (_, match) => {
      const numericVal = parseInt(match.replace(/,/g, ''), 10);
      if (isNaN(numericVal)) return _;
      return formatPrice(numericVal);
    });
  };

  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [wishlistedIds, setWishlistedIds] = useState<number[]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(12);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [modalFilters, setModalFilters] = useState<{
    min_price?: number;
    max_price?: number;
    property_type?: string;
    amenities?: string[];
  }>({});

  const getItemPrice = (item: ListingItem) => {
    const matched = item.priceText.match(/\d[\d,]*/);
    if (matched) {
      return parseInt(matched[0].replace(/,/g, ''), 10);
    }
    return 5000;
  };

  const handleMapWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(18, prev + 0.5));
    } else {
      setZoomLevel((prev) => Math.max(6, prev - 0.5));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const filterPills = [
    'Free parking',
    'Self check-in',
    'Wifi',
    '1+ bathrooms',
    'Air conditioning',
    'TV',
    'Kitchen',
  ];

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  // Filter items based on active pills and modal filters
  const displayedItems = section.items.filter((item) => {
    const itemPrice = getItemPrice(item);
    // 1. Modal price filter
    if (modalFilters.min_price && itemPrice < modalFilters.min_price) return false;
    if (modalFilters.max_price && itemPrice > modalFilters.max_price) return false;

    // 2. Modal property type filter
    if (modalFilters.property_type && modalFilters.property_type !== 'All types') {
      const typeStr = modalFilters.property_type.toLowerCase();
      const titleStr = item.title.toLowerCase();
      if (typeStr === 'apartment' && !titleStr.includes('flat') && !titleStr.includes('apartment') && !titleStr.includes('studio')) return false;
      if (typeStr === 'house' && !titleStr.includes('house') && !titleStr.includes('cottage')) return false;
      if (typeStr === 'villa' && !titleStr.includes('villa') && !titleStr.includes('estate') && !titleStr.includes('pool')) return false;
    }

    // 3. Pill filters
    if (activeFilters.length > 0) {
      const itemText = `${item.title} ${item.priceText}`.toLowerCase();
      for (const filter of activeFilters) {
        if (filter === 'Free parking' && !itemText.includes('parking') && !itemText.includes('free') && item.id % 2 !== 0) return false;
        if (filter === 'Wifi' && !itemText.includes('wifi') && item.id % 3 === 0) return false;
        if (filter === 'Air conditioning' && !itemText.includes('ac') && !itemText.includes('air') && item.id % 2 === 0) return false;
      }
    }

    return true;
  });

  // Convert section items to ListingCard format for FilterModal
  const availableListingsForModal: ListingCard[] = section.items.map((item) => ({
    id: item.id,
    title: item.title,
    location: section.title.replace('Popular homes in ', ''),
    price_per_night: getItemPrice(item),
    rating: item.rating,
    review_count: 12,
    property_type: item.title.startsWith('Flat') ? 'Apartment' : item.title.startsWith('Villa') ? 'Villa' : 'House',
    cover_image: item.imageUrl,
    images: [item.imageUrl],
    is_superhost: !item.isGuestFavorite,
    amenities: ['Wifi', 'Air conditioning', 'Kitchen', 'Free parking', 'Self check-in'],
    max_guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    host_name: 'Airbnb Host',
  }));

  const toggleWishlist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in to add to wishlist', 'info');
      return;
    }
    setWishlistedIds((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  // Coordinates offset for mock map pins
  const pinPositions = [
    { top: '28%', left: '48%' },
    { top: '35%', left: '38%' },
    { top: '42%', left: '56%' },
    { top: '50%', left: '32%' },
    { top: '38%', left: '68%' },
    { top: '60%', left: '44%' },
    { top: '68%', left: '58%' },
    { top: '25%', left: '62%' },
    { top: '45%', left: '22%' },
    { top: '55%', left: '72%' },
    { top: '75%', left: '36%' },
    { top: '30%', left: '28%' },
    { top: '65%', left: '25%' },
    { top: '80%', left: '65%' },
    { top: '20%', left: '40%' },
  ];

  const [isPaneScrolled, setIsPaneScrolled] = useState(false);

  const handlePaneScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 20) {
      setIsPaneScrolled(true);
    } else {
      setIsPaneScrolled(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full overflow-hidden bg-white dark:bg-[#1A1A1A]">
      {/* Header bar with centered filter pills - Smooth Fade Out & Height Collapse when Left Pane is Scrolled */}
      <div
        className={`transition-all duration-300 ease-in-out border-b border-airbnb-border dark:border-gray-800 flex items-center justify-center gap-3 overflow-x-auto no-scrollbar flex-shrink-0 bg-white dark:bg-[#1A1A1A] z-10 ${
          isPaneScrolled
            ? 'max-h-0 opacity-0 py-0 border-transparent overflow-hidden'
            : 'max-h-16 opacity-100 px-6 py-3'
        }`}
      >
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all flex-shrink-0 cursor-pointer shadow-2xs ${
            Object.keys(modalFilters).length > 0
              ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
              : 'border-airbnb-border dark:border-gray-700 hover:border-black dark:hover:border-white text-airbnb-black dark:text-gray-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {Object.keys(modalFilters).length > 0 && (
            <span className="w-2 h-2 rounded-full bg-airbnb-red" />
          )}
        </button>

        <div className="h-5 w-[1px] bg-airbnb-border dark:bg-gray-800 flex-shrink-0" />

        <div className="flex items-center gap-2">
          {filterPills.map((filter) => {
            const isActive = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-4 py-2 rounded-full border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                    : 'border-airbnb-border dark:border-gray-700 hover:border-black dark:hover:border-white text-airbnb-black dark:text-gray-200'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Layout: Left Scrollable Cards | Right Sticky Map */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT COLUMN: Scrollable Listings with Scroll Listener */}
        <div
          onScroll={handlePaneScroll}
          className="w-full lg:w-[58%] xl:w-[55%] h-full overflow-y-auto p-6 scroll-smooth"
        >
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-airbnb-black dark:text-white tracking-tight">
              Over 1,000 homes in Noida
            </h1>
            <div className="text-sm text-airbnb-grey dark:text-gray-400 mt-1 flex items-center gap-3">
              <span>Book unique places to stay with verified host amenities.</span>
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-md font-semibold">
                🏷️ Prices include all fees
              </span>
            </div>
          </div>

          {/* Listings Grid OR Empty State when no items match filters */}
          {displayedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
              {displayedItems.map((item, index) => {
                const isWishlisted = wishlistedIds.includes(item.id);
                const isHovered = hoveredItemId === item.id;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                    onClick={() => router.push(`/listings/${item.id}`)}
                    className={`group flex flex-col gap-2.5 cursor-pointer rounded-2xl p-2 transition-all duration-200 ${
                      isHovered
                        ? 'ring-2 ring-black dark:ring-white bg-gray-50 dark:bg-[#242424] shadow-md'
                        : 'hover:bg-gray-50/60 dark:hover:bg-[#222222]'
                    }`}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Left Badge */}
                      {item.isGuestFavorite ? (
                        <div className="absolute top-3 left-3 bg-white/95 dark:bg-black/90 text-airbnb-black dark:text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
                          Guest favourite
                        </div>
                      ) : (
                        <div className="absolute top-3 left-3 bg-black/75 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs backdrop-blur-xs">
                          Superhost
                        </div>
                      )}

                      {/* Wishlist Heart Button */}
                      <button
                        onClick={(e) => toggleWishlist(e, item.id)}
                        className="absolute top-3 right-3 p-1.5 rounded-full hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            isWishlisted
                              ? 'fill-airbnb-red text-airbnb-red'
                              : 'text-white fill-black/30 stroke-[2]'
                          }`}
                        />
                      </button>

                      {/* Image carousel dot indicators */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-1 px-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-airbnb-black dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-airbnb-black dark:text-white flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-black dark:fill-white text-black dark:text-white" />
                          <span>{item.rating.toFixed(item.rating % 1 === 0 ? 1 : 2)}</span>
                        </div>
                      </div>

                      <div className="text-xs text-airbnb-grey dark:text-gray-400 truncate">
                        Spacious and Cozy 5bhk villa wt pvt Pool...
                      </div>
                      <div className="text-xs text-airbnb-grey dark:text-gray-400">
                        5 bedrooms · 5 queen beds · 6 bathrooms
                      </div>
                      <div className="text-xs text-airbnb-grey dark:text-gray-400">
                        25–27 Sept
                      </div>

                      <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                        <span className="line-through text-xs text-airbnb-grey dark:text-gray-400 font-medium">
                          {formatPrice(45484)}
                        </span>
                        <span className="font-extrabold text-sm text-airbnb-black dark:text-white">
                          {formatItemPriceText(item.priceText)}
                        </span>
                      </div>

                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-sm">
                          Free cancellation
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* EMPTY STATE WHEN NO MATCHING LISTINGS FOR FILTERS */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center my-6 bg-gray-50 dark:bg-[#222222] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-airbnb-red flex items-center justify-center mb-4 shadow-xs">
                <MapPinOff className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-airbnb-black dark:text-white mb-2">
                No places found matching your filters
              </h3>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 max-w-sm mb-6 leading-relaxed">
                Try adjusting or clearing your active filters to view all available stays in this area.
              </p>
              <button
                onClick={() => {
                  setActiveFilters([]);
                  setModalFilters({});
                  showToast('Filters cleared', 'info');
                }}
                className="px-6 py-2.5 bg-airbnb-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-full hover:scale-105 transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear filters & view all</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real Interactive Leaflet Map with OpenStreetMap */}
        <div className="w-full lg:w-[42%] xl:w-[45%] h-full relative overflow-hidden flex-shrink-0 border-l border-airbnb-border dark:border-gray-800 z-0">
          <LeafletMapComponent
            items={displayedItems}
            hoveredItemId={hoveredItemId}
            setHoveredItemId={setHoveredItemId}
            formatItemPriceText={formatItemPriceText}
            onSelectListing={(id) => router.push(`/listings/${id}`)}
          />
        </div>

      </div>

      {/* Interactive Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={(filters) => {
          setModalFilters(filters);
          setIsFilterModalOpen(false);
          showToast('Filters applied successfully', 'success');
        }}
        availableListings={availableListingsForModal}
      />
    </div>
  );
};
