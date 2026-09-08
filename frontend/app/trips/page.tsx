'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Booking } from '@/types';
import { apiGetMyTrips, apiCancelBooking } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/context/LocaleContext';
import { Calendar, MapPin, Users, XCircle, ArrowRight } from 'lucide-react';

export default function MyTripsPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadTrips() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const data = await apiGetMyTrips(currentUser.id);
        setBookings(data || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load trips', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadTrips();
  }, [currentUser]);

  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Cancellation Modal Animation State
  const [isCancelModalRendered, setIsCancelModalRendered] = useState<boolean>(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (cancellingBookingId !== null) {
      setIsCancelModalRendered(true);
      const timer = setTimeout(() => setIsCancelModalVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setIsCancelModalVisible(false);
      const timer = setTimeout(() => setIsCancelModalRendered(false), 250);
      return () => clearTimeout(timer);
    }
  }, [cancellingBookingId]);

  const confirmCancelBooking = async () => {
    if (!cancellingBookingId) return;
    try {
      setIsCancelling(true);
      await apiCancelBooking(cancellingBookingId, currentUser?.id);
      showToast('Reservation cancelled successfully', 'info');
      setBookings((prev) =>
        prev.map((b) => (b.id === cancellingBookingId ? { ...b, status: 'CANCELLED' } : b))
      );
      setCancellingBookingId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const upcomingTrips = bookings.filter((b) => b.status === 'CONFIRMED');
  const pastTrips = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 py-10 flex-1">
        <h1 className="text-3xl font-bold text-airbnb-black dark:text-white mb-8">Trips</h1>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-160px)]">
            {/* Left Column: Information & Get Started */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left py-2 sm:py-6 pr-0 lg:pr-6">
              <div className="w-full max-w-[320px] aspect-[4/3] relative mb-6 flex items-center justify-center">
                <img
                  src="https://a0.muscache.com/im/pictures/miso/Hosting-53274539/original/879e60d9-2917-48f8-8a03-7cf5d50aa8c3.jpeg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                  alt="Map out your next trip"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
                <div className="hidden w-full h-52 bg-gradient-to-br from-rose-50/80 via-amber-50/60 to-sky-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl border border-rose-100/60 dark:border-gray-700 flex-col items-center justify-center p-6 text-center shadow-inner relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-200/40 rounded-full blur-xl" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-sky-200/40 rounded-full blur-xl" />
                  
                  {/* Isometric 3D Graphic Mock */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3 mb-2 animate-bounce">
                      <span className="text-4xl filter drop-shadow">🎈</span>
                      <span className="text-4xl filter drop-shadow">🏡</span>
                    </div>
                    <div className="w-40 h-24 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-md p-3 flex flex-col items-center justify-center relative">
                      <div className="w-full border-b border-dashed border-rose-300 dark:border-rose-700 my-1" />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1">Explore Destinations</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Interactive Map View</span>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-airbnb-black dark:text-white mb-3 tracking-tight">
                Map out your next trip
              </h2>
              <p className="text-airbnb-grey dark:text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-sm">
                After you book a trip, experience or service, come back here to see details, explore the map and save places to visit.
              </p>

              <Link
                href="/"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-[#E81948] to-[#E31C5F] hover:from-[#D70466] hover:to-[#BD1E59] text-white font-bold text-base rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Get started
              </Link>
            </div>

            {/* Right Column: Full height interactive map container */}
            <div className="lg:col-span-7 xl:col-span-8 w-full h-[520px] lg:h-[calc(100vh-180px)] min-h-[460px] max-h-[720px] rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm relative bg-[#aad3df]">
              <iframe
                title="World Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-60%2C180%2C75&amp;layer=mapnik"
                className="w-full h-full border-none filter contrast-[1.05] brightness-[1.02]"
                loading="lazy"
              />
              
              {/* Floating Custom Zoom / Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col bg-white dark:bg-[#1A1A1A] rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden z-10">
                <button
                  type="button"
                  title="Zoom In"
                  onClick={(e) => {
                    const iframe = e.currentTarget.parentElement?.previousElementSibling as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg border-b border-gray-200 dark:border-gray-800 transition-colors cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={(e) => {
                    const iframe = e.currentTarget.parentElement?.previousElementSibling as HTMLIFrameElement;
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-lg transition-colors cursor-pointer"
                >
                  −
                </button>
              </div>

              {/* Map Footer Attribution */}
              <div className="absolute bottom-2 left-3 bg-white/90 dark:bg-black/90 backdrop-blur-md text-[11px] font-semibold text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md shadow-sm z-10 flex items-center gap-1">
                <span className="font-bold text-airbnb-black dark:text-white">Google</span>
              </div>
              <div className="absolute bottom-2 right-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm text-[10px] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded z-10 hidden sm:block">
                Map Data ©2026 | Terms
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Trips */}
            <div>
              <h2 className="text-xl font-bold text-airbnb-black dark:text-white mb-6">Upcoming Reservations</h2>
              {upcomingTrips.length === 0 ? (
                <div className="text-sm text-airbnb-grey dark:text-gray-400 bg-airbnb-lightGrey dark:bg-[#1A1A1A] p-6 rounded-2xl border border-transparent dark:border-gray-800">
                  No upcoming trips scheduled.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingTrips.map((b) => (
                    <div
                      key={b.id}
                      className="border border-airbnb-border dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#1A1A1A] flex flex-col sm:flex-row"
                    >
                      <div className="w-full sm:w-2/5 aspect-square sm:aspect-auto relative">
                        <img
                          src={b.listing?.cover_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
                          alt={b.listing?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                              {b.status}
                            </span>
                            <span className="text-xs text-airbnb-grey dark:text-gray-400 font-semibold">#TRIP-{b.id}</span>
                          </div>

                          <Link
                            href={`/listings/${b.listing_id}`}
                            className="font-bold text-base text-airbnb-black dark:text-white hover:underline line-clamp-1"
                          >
                            {b.listing?.title}
                          </Link>

                          <div className="flex items-center gap-1 text-xs text-airbnb-grey dark:text-gray-400 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{b.listing?.location}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-airbnb-black dark:text-gray-200">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-airbnb-grey dark:text-gray-400" />
                            <span>
                              {b.check_in} → {b.check_out}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-airbnb-grey dark:text-gray-400" />
                            <span>{b.guests} guests</span>
                          </div>
                          <div className="font-bold text-sm text-airbnb-black dark:text-white pt-1">
                            Total: {formatPrice(b.total_price)}
                          </div>
                        </div>

                        <button
                          onClick={() => setCancellingBookingId(b.id)}
                          className="flex items-center justify-center gap-2 py-2 px-4 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel reservation</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past & Cancelled Trips */}
            {pastTrips.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-airbnb-black dark:text-white mb-6">Past & Cancelled Trips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastTrips.map((b) => (
                    <div
                      key={b.id}
                      className="border border-airbnb-border dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#1A1A1A] flex flex-col sm:flex-row opacity-85"
                    >
                      <div className="w-full sm:w-2/5 aspect-square sm:aspect-auto relative">
                        <img
                          src={b.listing?.cover_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'}
                          alt={b.listing?.title}
                          className="w-full h-full object-cover grayscale-20"
                        />
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'CANCELLED'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <div className="font-bold text-base text-airbnb-black dark:text-white line-clamp-1">{b.listing?.title}</div>
                          <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-1">{b.listing?.location}</div>
                        </div>

                        <div className="text-xs text-airbnb-grey dark:text-gray-400 space-y-1">
                          <div>
                            Dates: {b.check_in} → {b.check_out}
                          </div>
                          <div className="font-semibold text-airbnb-black dark:text-white">Total Paid: {formatPrice(b.total_price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sleek Custom Dark Cancellation Modal with Smooth 2-way Fade & Zoom Transitions */}
      {isCancelModalRendered && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            isCancelModalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setCancellingBookingId(null)}
        >
          <div
            className={`bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
              isCancelModalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <div>
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-1">Cancel Reservation?</h3>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 leading-relaxed">
                Are you sure you want to cancel this trip? The reserved dates will be immediately freed up on the listing calendar.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, cancel reservation'}
              </button>
              <button
                onClick={() => setCancellingBookingId(null)}
                disabled={isCancelling}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-airbnb-black dark:text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Keep reservation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
