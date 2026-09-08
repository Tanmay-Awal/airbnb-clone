'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ListingCard, Booking } from '@/types';
import {
  apiGetHostListings,
  apiGetHostBookings,
  apiGetHostMetrics,
  apiDeleteListing
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useLocale } from '@/context/LocaleContext';
import {
  Building2,
  Calendar,
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';

export default function HostDashboardPage() {
  const router = useRouter();
  const { currentUser, isHost } = useAuth();
  const { showToast } = useToast();
  const { formatPrice } = useLocale();

  const [listings, setListings] = useState<ListingCard[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [metrics, setMetrics] = useState({
    total_listings: 0,
    total_bookings: 0,
    upcoming_bookings: 0,
    total_revenue: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings'>('listings');

  useEffect(() => {
    async function loadHostData() {
      if (!currentUser) return;
      try {
        setIsLoading(true);
        const [hostListings, hostBookings, hostMetrics] = await Promise.all([
          apiGetHostListings(currentUser.id),
          apiGetHostBookings(currentUser.id),
          apiGetHostMetrics(currentUser.id),
        ]);

        setListings(hostListings);
        setBookings(hostBookings);
        setMetrics(hostMetrics);
      } catch (err: any) {
        showToast(err.message || 'Failed to load host dashboard', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadHostData();
  }, [currentUser]);

  const handleDeleteListing = async (listingId: number) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    try {
      await apiDeleteListing(listingId, currentUser?.id);
      showToast('Listing deleted successfully', 'info');
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing', 'error');
    }
  };

  if (!isHost && !isLoading) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 py-10 flex-1">
        {/* Header Title & Create Listing Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-airbnb-black dark:text-white">Host Dashboard</h1>

            <p className="text-sm text-airbnb-grey mt-1">Manage your properties, reservations, and earnings</p>
          </div>
          <Link
            href="/host/new"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-bold text-sm rounded-xl shadow-md hover:opacity-95 transition-opacity"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Listing</span>
          </Link>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="border border-airbnb-border p-6 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-airbnb-grey">Total Listings</span>
              <Building2 className="w-5 h-5 text-airbnb-red" />
            </div>
            <div className="text-3xl font-bold text-airbnb-black">{metrics.total_listings}</div>
          </div>

          <div className="border border-airbnb-border p-6 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-airbnb-grey">Total Bookings</span>
              <Calendar className="w-5 h-5 text-airbnb-red" />
            </div>
            <div className="text-3xl font-bold text-airbnb-black">{metrics.total_bookings}</div>
          </div>

          <div className="border border-airbnb-border p-6 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-airbnb-grey">Upcoming Stays</span>
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-airbnb-black">{metrics.upcoming_bookings}</div>
          </div>

          <div className="border border-airbnb-border p-6 rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-airbnb-grey">Total Revenue</span>
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-airbnb-black">{formatPrice(metrics.total_revenue)}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-airbnb-border mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'listings' ? 'border-airbnb-black text-airbnb-black' : 'border-transparent text-airbnb-grey'
            }`}
          >
            My Properties ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'bookings' ? 'border-airbnb-black text-airbnb-black' : 'border-transparent text-airbnb-grey'
            }`}
          >
            Guest Reservations ({bookings.length})
          </button>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-20 bg-gray-200 rounded-xl" />
            <div className="h-20 bg-gray-200 rounded-xl" />
          </div>
        ) : activeTab === 'listings' ? (
          <div className="border border-airbnb-border rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-airbnb-black">
                <thead className="bg-airbnb-lightGrey text-xs font-bold uppercase tracking-wider border-b border-airbnb-border">
                  <tr>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Price/Night</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-airbnb-border">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={l.cover_image || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=150'}
                          alt={l.title}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                        <span className="font-semibold">{l.title}</span>
                      </td>
                      <td className="px-6 py-4 text-airbnb-grey">{l.location}</td>
                      <td className="px-6 py-4 font-medium">{l.property_type}</td>
                      <td className="px-6 py-4 font-bold">{formatPrice(l.price_per_night)}</td>
                      <td className="px-6 py-4 font-semibold">{l.rating > 0 ? `★ ${l.rating.toFixed(1)}` : 'New'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/listings/${l.id}`}
                            className="p-2 hover:bg-gray-200 rounded-lg text-airbnb-grey hover:text-airbnb-black transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            className="p-2 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-airbnb-border rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-airbnb-black">
                <thead className="bg-airbnb-lightGrey text-xs font-bold uppercase tracking-wider border-b border-airbnb-border">
                  <tr>
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Property</th>
                    <th className="px-6 py-4">Guest</th>
                    <th className="px-6 py-4">Check-in → Check-out</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-airbnb-border">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold">#TRIP-{b.id}</td>
                      <td className="px-6 py-4 font-semibold">{b.listing?.title}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-airbnb-red text-white font-extrabold text-xs flex items-center justify-center flex-shrink-0">
                          {b.guest?.name ? b.guest.name.charAt(0).toUpperCase() : 'G'}
                        </div>
                        <span>{b.guest?.name || 'Guest'}</span>
                      </td>
                      <td className="px-6 py-4 text-airbnb-grey">
                        {b.check_in} → {b.check_out}
                      </td>
                      <td className="px-6 py-4 font-bold">{formatPrice(b.total_price)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
