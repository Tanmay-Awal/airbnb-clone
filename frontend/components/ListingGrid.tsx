'use client';

import React from 'react';
import { ListingCard as ListingCardType } from '@/types';
import { ListingCard } from '@/components/ListingCard';

interface ListingGridProps {
  listings: ListingCardType[];
  isLoading?: boolean;
  onResetFilters?: () => void;
  wishlistIds?: number[];
  onWishlistToggle?: (listingId: number, isWishlisted: boolean) => void;
}

export const ListingGrid: React.FC<ListingGridProps> = ({
  listings,
  isLoading = false,
  onResetFilters,
  wishlistIds = [],
  onWishlistToggle,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-8">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-3 animate-pulse">
            <div className="aspect-square w-full rounded-2xl bg-gray-200" />
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
            <div className="h-4 w-1/4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-airbnb-black mb-2">No stays found</h3>
        <p className="text-airbnb-grey text-sm max-w-md mb-6">
          Try changing or clearing some of your filters or searching for another location.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-6 py-3 bg-airbnb-black text-white font-semibold text-sm rounded-xl hover:bg-black transition-colors cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 flex-nowrap w-full">
      {listings.map((listing) => (
        <div key={listing.id} className="w-[185px] sm:w-[195px] flex-shrink-0">
          <ListingCard
            listing={listing}
            isWishlistedInitial={wishlistIds.includes(listing.id)}
            onWishlistToggle={onWishlistToggle}
          />
        </div>
      ))}
    </div>
  );
};
