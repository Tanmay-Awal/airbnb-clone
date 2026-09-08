'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionGroup, ListingItem } from '@/lib/categoriesData';
import { useLocale } from '@/context/LocaleContext';

interface CategorySectionRowProps {
  section: SectionGroup;
  wishlistIds: number[];
  onWishlistToggle: (id: number, currentStatus: boolean) => void;
}

export const CategorySectionRow: React.FC<CategorySectionRowProps> = ({
  section,
  wishlistIds,
  onWishlistToggle,
}) => {
  const router = useRouter();
  const { formatPrice } = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatItemPriceText = (priceText: string) => {
    // Matches numbers like 7,400 or 9397 or 45,484
    return priceText.replace(/₹\s*([\d,]+)/g, (_, match) => {
      const numericVal = parseInt(match.replace(/,/g, ''), 10);
      if (isNaN(numericVal)) return _;
      return formatPrice(numericVal);
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -600 : 600;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleHeaderClick = () => {
    router.push(`/search?section=${section.id}&title=${encodeURIComponent(section.title)}`);
  };

  return (
    <section className="flex flex-col gap-4">
      {/* Section Header with Title, Arrow indicator and Carousel Navigation */}
      <div className="flex items-center justify-between">
        <div onClick={handleHeaderClick} className="flex items-center gap-2 group cursor-pointer">
          <h2 className="text-xl font-bold text-airbnb-black dark:text-white tracking-tight group-hover:underline">
            {section.title}
          </h2>
          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-airbnb-black dark:text-white group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
            →
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center text-airbnb-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center text-airbnb-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Carousel Row */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
      >
        {section.items.map((item) => {
          const isWishlisted = wishlistIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => router.push(`/listings/${item.id}`)}
              className="flex-shrink-0 w-[195px] sm:w-[215px] md:w-[225px] lg:w-[235px] flex flex-col gap-1.5 group cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top Left Badge: Guest Favourite OR Time Badge */}
                {item.isGuestFavorite && (
                  <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-black/90 text-airbnb-black dark:text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                    Guest favourite
                  </div>
                )}

                {item.timeBadge && (
                  <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-black/90 text-airbnb-black dark:text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                    {item.timeBadge}
                  </div>
                )}

                {/* Top Right Heart Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onWishlistToggle(item.id, isWishlisted);
                  }}
                  aria-label="Wishlist"
                  className="absolute top-2.5 right-2.5 p-1 rounded-full hover:scale-110 transition-transform cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isWishlisted
                        ? 'fill-airbnb-red text-airbnb-red'
                        : 'text-white fill-black/30 stroke-[2]'
                    }`}
                  />
                </button>
              </div>

              {/* Card Details */}
              <div className="flex flex-col gap-0.5 text-xs">
                <div className="font-bold text-airbnb-black dark:text-white truncate leading-tight">
                  {item.title}
                </div>
                <div className="flex items-center justify-between text-[11px] text-airbnb-black dark:text-gray-200 mt-0.5">
                  <span className="font-medium truncate">{formatItemPriceText(item.priceText)}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Star className="w-3 h-3 fill-black dark:fill-white text-black dark:text-white" />
                    <span className="font-bold">{item.rating.toFixed(item.rating % 1 === 0 ? 1 : 2)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
