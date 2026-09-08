'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { Booking } from '@/types';
import { apiGetMyTrips } from '@/lib/api';
import { Luggage, Users, MessageSquare, Star, ChevronDown, ChevronUp, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { formatPrice } = useLocale();
  const [activeTab, setActiveTab] = useState<'about' | 'past_trips' | 'connections'>('about');
  const [showReviewsWritten, setShowReviewsWritten] = useState<boolean>(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);

  useEffect(() => {
    async function loadUserTrips() {
      if (!currentUser) {
        setBookings([]);
        setIsLoadingBookings(false);
        return;
      }
      try {
        setIsLoadingBookings(true);
        const data = await apiGetMyTrips(currentUser.id);
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching user trips:', err);
      } finally {
        setIsLoadingBookings(false);
      }
    }
    loadUserTrips();
  }, [currentUser]);

  const userInitial = currentUser?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 py-10 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* LEFT SIDEBAR: Tabs Navigation */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <h1 className="text-3xl font-extrabold text-airbnb-black dark:text-white tracking-tight mb-2 px-2">
              Profile
            </h1>

            <div className="flex flex-col gap-1 w-full">
              
              {/* 1. About me Tab */}
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                  activeTab === 'about'
                    ? 'bg-[#F2F2F2] dark:bg-[#262626] font-bold text-airbnb-black dark:text-white shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-grey dark:text-gray-400 font-medium'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-airbnb-red flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                  {userInitial}
                </div>
                <span>About me</span>
              </button>

              {/* 2. Past trips Tab */}
              <button
                onClick={() => setActiveTab('past_trips')}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                  activeTab === 'past_trips'
                    ? 'bg-[#F2F2F2] dark:bg-[#262626] font-bold text-airbnb-black dark:text-white shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-grey dark:text-gray-400 font-medium'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-base flex-shrink-0">
                  🧳
                </div>
                <span>Past trips</span>
              </button>

              {/* 3. Connections Tab */}
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all cursor-pointer text-left ${
                  activeTab === 'connections'
                    ? 'bg-[#F2F2F2] dark:bg-[#262626] font-bold text-airbnb-black dark:text-white shadow-xs'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-grey dark:text-gray-400 font-medium'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 flex items-center justify-center text-base flex-shrink-0">
                  🧑‍🤝‍🧑
                </div>
                <span>Connections</span>
              </button>
            </div>
          </div>

          {/* RIGHT MAIN PANEL */}
          <div className="md:col-span-8 border-l border-gray-100 dark:border-gray-800/80 md:pl-12">
            
            {/* TAB 1: ABOUT ME */}
            {activeTab === 'about' && (
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-extrabold text-airbnb-black dark:text-white">About me</h2>
                </div>

                <div className="flex items-center gap-8">
                  <div className="border border-airbnb-border dark:border-gray-800 rounded-3xl p-8 w-64 h-64 bg-white dark:bg-[#1A1A1A] shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-4xl font-extrabold mb-3 shadow-xs">
                      {userInitial}
                    </div>
                    <h3 className="text-2xl font-bold text-airbnb-black dark:text-white">
                      {currentUser?.name || 'Guest User'}
                    </h3>
                    <span className="text-xs text-airbnb-grey dark:text-gray-400 mt-1 capitalize font-medium">
                      {currentUser?.role === 'host' ? 'Host' : 'Guest'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-airbnb-border dark:border-gray-800 my-4" />

                <div className="flex flex-col gap-4">
                  <button
                    onClick={() => setShowReviewsWritten(!showReviewsWritten)}
                    className="flex items-center gap-3 text-sm font-bold text-airbnb-black dark:text-white hover:underline cursor-pointer w-fit"
                  >
                    <MessageSquare className="w-5 h-5 text-airbnb-grey dark:text-gray-400" />
                    <span>Show reviews I've written</span>
                    {showReviewsWritten ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showReviewsWritten && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <div className="text-xs text-airbnb-grey dark:text-gray-400 italic bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        You haven't submitted any reviews yet. Reviews you leave after completed stays will appear here.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PAST TRIPS */}
            {activeTab === 'past_trips' && (
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-extrabold text-airbnb-black dark:text-white mb-2">Past trips</h2>

                {isLoadingBookings ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                    <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
                    <div className="h-56 bg-gray-100 dark:bg-gray-800 rounded-3xl" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="p-8 border border-airbnb-border dark:border-gray-800 rounded-3xl bg-gray-50 dark:bg-[#1A1A1A] text-center flex flex-col items-center gap-3">
                    <div className="text-4xl">🧳</div>
                    <div className="font-bold text-base text-airbnb-black dark:text-white">No past trips yet</div>
                    <p className="text-xs text-airbnb-grey dark:text-gray-400 max-w-sm">
                      When you make reservations and complete stays, your trip history will appear here under your account.
                    </p>
                    <Link
                      href="/"
                      className="mt-2 px-5 py-2.5 bg-airbnb-red text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
                    >
                      Explore stays
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {bookings.map((trip) => (
                      <div
                        key={trip.id}
                        className="border border-airbnb-border dark:border-gray-800 rounded-3xl overflow-hidden bg-white dark:bg-[#1A1A1A] shadow-xs hover:shadow-md transition-shadow"
                      >
                        <div className="h-40 w-full relative">
                          <img
                            src={trip.listing?.cover_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
                            alt={trip.listing?.title || 'Trip'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5 flex flex-col gap-2">
                          <div className="font-bold text-sm text-airbnb-black dark:text-white line-clamp-1">
                            {trip.listing?.title || 'Reservation'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-airbnb-grey dark:text-gray-400">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{trip.listing?.location || 'India'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-airbnb-grey dark:text-gray-400 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{trip.check_in} → {trip.check_out}</span>
                          </div>
                          <div className="font-extrabold text-xs text-airbnb-black dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800 mt-2 flex justify-between">
                            <span>Total Paid</span>
                            <span>{formatPrice(trip.total_price)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONNECTIONS */}
            {activeTab === 'connections' && (
              <div className="flex flex-col gap-6">
                <h2 className="text-3xl font-extrabold text-airbnb-black dark:text-white mb-2">Connections</h2>
                <p className="text-xs text-airbnb-grey dark:text-gray-400 mb-2">
                  Hosts and guests you have connected with through your reservations.
                </p>

                <div className="p-8 border border-airbnb-border dark:border-gray-800 rounded-3xl bg-gray-50 dark:bg-[#1A1A1A] text-center flex flex-col items-center gap-3">
                  <div className="text-4xl">🧑‍🤝‍🧑</div>
                  <div className="font-bold text-base text-airbnb-black dark:text-white">No connections yet</div>
                  <p className="text-xs text-airbnb-grey dark:text-gray-400 max-w-sm">
                    Hosts and guests from your stays will automatically show up here as connections once you complete bookings.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

