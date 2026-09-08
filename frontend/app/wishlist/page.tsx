'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ListingGrid } from '@/components/ListingGrid';
import { Wishlist, ListingCard } from '@/types';
import { apiGetWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Heart } from 'lucide-react';

export default function WishlistPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeCollection, setActiveCollection] = useState<'all' | 'recently_viewed' | 'saved' | null>(null);

  useEffect(() => {
    async function loadWishlist() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await apiGetWishlist(currentUser.id);
        setWishlists(data || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load wishlist', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadWishlist();
  }, [currentUser]);

  const listings: ListingCard[] = wishlists.map((w) => w.listing).filter(Boolean);
  const wishlistIds = wishlists.map((w) => w.listing_id);

  const handleWishlistToggle = (listingId: number, isWishlisted: boolean) => {
    if (!isWishlisted) {
      setWishlists((prev) => prev.filter((w) => w.listing_id !== listingId));
    }
  };

  // Preview images from actual wishlisted items
  const coverImages = listings.map((l) => l.cover_image).filter(Boolean);
  const mainCover = coverImages[0] || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80';
  const collageImages = [
    coverImages[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    coverImages[1] || 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=400&q=80',
    coverImages[2] || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="max-w-[1760px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 flex-1">
        
        {/* If inside a specific collection view */}
        {activeCollection ? (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setActiveCollection(null)}
                className="w-10 h-10 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                aria-label="Back to wishlists"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold capitalize text-airbnb-black dark:text-white">
                  {activeCollection === 'recently_viewed' ? 'Recently viewed' : 'Saved stays'}
                </h1>
                <p className="text-sm text-airbnb-grey dark:text-gray-400 font-medium mt-0.5">
                  {listings.length} {listings.length === 1 ? 'saved item' : 'saved items'}
                </p>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="py-20 text-center border border-airbnb-border dark:border-gray-800 rounded-3xl p-8 bg-airbnb-lightGrey dark:bg-[#1e1e1e]">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                  <Heart className="w-8 h-8 fill-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-airbnb-black dark:text-white mb-2">
                  No saved stays in this collection
                </h3>
                <p className="text-airbnb-grey dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
                  As you search, tap the heart icon on any stay or experience to save your favorites here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#E81948] to-[#E31C5F] text-white font-bold text-sm rounded-xl hover:shadow-lg transition-all"
                >
                  Start exploring
                </Link>
              </div>
            ) : (
              <ListingGrid
                listings={listings}
                isLoading={isLoading}
                wishlistIds={wishlistIds}
                onWishlistToggle={handleWishlistToggle}
              />
            )}
          </div>
        ) : (
          /* Main Wishlists Overview Cards */
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-airbnb-black dark:text-white tracking-tight mb-8">
              Wishlists
            </h1>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
                <div className="aspect-square bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse" />
              </div>
            ) : listings.length === 0 ? (
              <div className="max-w-md py-12">
                <h2 className="text-2xl font-bold text-airbnb-black dark:text-white mb-3">
                  Create your first wishlist
                </h2>
                <p className="text-airbnb-grey dark:text-gray-400 text-sm leading-relaxed mb-6">
                  As you search, tap the heart icon on any stay or experience to save your favorites to a wishlist.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-[#E81948] to-[#E31C5F] text-white font-bold text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                >
                  Start searching
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                
                {/* Card 1: Recently viewed (Dynamic 2x2 grid collage from user wishlists) */}
                <div
                  onClick={() => setActiveCollection('recently_viewed')}
                  className="group cursor-pointer flex flex-col gap-3"
                >
                  <div className="w-full aspect-square rounded-3xl overflow-hidden bg-[#EBEBEB] dark:bg-[#262626] border border-airbnb-border dark:border-gray-800 p-2 shadow-xs group-hover:shadow-md transition-all">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 w-full h-full rounded-2xl overflow-hidden">
                      <img
                        src={collageImages[0]}
                        alt={listings[0]?.title || 'Wishlist item 1'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <img
                        src={collageImages[1]}
                        alt={listings[1]?.title || 'Wishlist item 2'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <img
                        src={collageImages[2]}
                        alt={listings[2]?.title || 'Wishlist item 3'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="w-full h-full bg-gray-400/50 dark:bg-gray-700/60 rounded-lg flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200 backdrop-blur-xs">
                        +{Math.max(0, listings.length - 3)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-airbnb-black dark:text-white leading-tight">
                      Recently viewed
                    </h3>
                    <p className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5 font-medium">
                      Today
                    </p>
                  </div>
                </div>

                {/* Card 2: Dynamic User Saved Collection (Displays real wishlisted cover & count) */}
                <div
                  onClick={() => setActiveCollection('saved')}
                  className="group cursor-pointer flex flex-col gap-3"
                >
                  <div className="w-full aspect-square rounded-3xl overflow-hidden bg-[#EBEBEB] dark:bg-[#262626] border border-airbnb-border dark:border-gray-800 p-2 shadow-xs group-hover:shadow-md transition-all">
                    <div className="w-full h-full rounded-2xl overflow-hidden relative">
                      <img
                        src={mainCover}
                        alt={listings[0]?.title || 'Saved stays cover'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-airbnb-black dark:text-white leading-tight">
                      Saved stays
                    </h3>
                    <p className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5 font-medium">
                      {listings.length} {listings.length === 1 ? 'saved' : 'saved'}
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
