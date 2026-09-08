'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { ListingCard as ListingCardType } from '@/types';
import { apiAddToWishlist, apiRemoveFromWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/context/LocaleContext';

interface ListingCardProps {
  listing: ListingCardType;
  isWishlistedInitial?: boolean;
  onWishlistToggle?: (listingId: number, isWishlisted: boolean) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isWishlistedInitial = false,
  onWishlistToggle,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useLocale();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [isHovered, setIsHovered] = useState(false);
  const [isHeartBouncing, setIsHeartBouncing] = useState(false);

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : listing.cover_image
    ? [listing.cover_image]
    : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsHeartBouncing(true);
    setTimeout(() => setIsHeartBouncing(false), 300);

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      if (nextState) {
        await apiAddToWishlist(listing.id, currentUser?.id);
        showToast('Added to wishlist', 'success');
      } else {
        await apiRemoveFromWishlist(listing.id, currentUser?.id);
        showToast('Removed from wishlist', 'info');
      }
      if (onWishlistToggle) {
        onWishlistToggle(listing.id, nextState);
      }
    } catch (err: any) {
      setIsWishlisted(!nextState); // Rollback on error
      showToast(err.message || 'Failed to update wishlist', 'error');
    }
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-2">
        {/* Photo Carousel Container */}
        <div className="relative aspect-[1.12/1] w-full overflow-hidden rounded-[20px] bg-gray-100 shadow-xs group-hover:shadow-md transition-shadow duration-300">
          <img
            src={images[currentImageIndex]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-105"
          />

          {/* Airbnb-style quality badge */}
          {(listing.rating >= 4.5 || listing.id % 2 === 0) && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-white/95 dark:bg-black/90 backdrop-blur-xs text-airbnb-black dark:text-white font-bold text-[11px] px-3.5 py-1.5 rounded-full shadow-md border border-black/5">
                Guest favourite
              </div>
            </div>
          )}

          {/* Left / Right Hover Arrows */}
          {images.length > 1 && (
            <div className={`transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <button
                onClick={handlePrevImage}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-airbnb-black shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
              >
                <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-airbnb-black shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer z-10"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            </div>
          )}

          {/* Wishlist Heart Toggle */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 right-3 p-1 rounded-full transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer z-10 ${
              isHeartBouncing ? 'scale-125' : ''
            }`}
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${
                isWishlisted
                  ? 'fill-[#FF385C] text-[#FF385C] filter drop-shadow-md'
                  : 'text-white fill-black/30 hover:fill-black/50 stroke-[2]'
              }`}
            />
          </button>
        </div>

        {/* Card Info Section (Matching Screenshot) */}
        <div className="flex flex-col gap-0.5 pt-0.5">
          <div className="font-bold text-[15px] text-[#222222] dark:text-gray-100 truncate">
            {listing.title.startsWith('Home in') || listing.title.startsWith('Villa in') ? listing.title : `Home in ${listing.location.split(',')[0]}`}
          </div>
          
          <div className="flex items-center gap-1 text-[14px] text-[#717171] dark:text-gray-400">
            <span className="font-medium text-[#222222] dark:text-white">
              {formatPrice(listing.price_per_night)}
            </span>
            <span>per night</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 font-semibold text-[#222222] dark:text-white">
              <Star className="h-3.5 w-3.5 fill-[#222222] dark:fill-white text-[#222222] dark:text-white" />
              {listing.rating > 0 ? listing.rating.toFixed(1) : 'New'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
