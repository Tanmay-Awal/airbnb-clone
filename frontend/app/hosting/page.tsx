'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/components/Toast';
import { apiGetHostDashboard, apiGetHostListings, apiDeleteListing } from '@/lib/api';
import {
  ClipboardList,
  Calendar,
  Home,
  MessageSquare,
  Plus,
  ArrowRight,
  User as UserIcon,
  Grid,
  Globe,
  LogOut,
  Bell,
  X,
  Menu as MenuIcon,
  Trash2,
  ExternalLink,
  Edit3,
  Share,
  Check,
  Loader2,
  List
} from 'lucide-react';
import { HostCalendar } from '@/components/HostCalendar';
import { EditListingModal } from '@/components/EditListingModal';

export default function HostDashboardPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { setShowLocaleModal, formatPrice } = useLocale();
  const { showToast } = useToast();

  const [activeNavTab, setActiveNavTab] = useState<'today' | 'calendar' | 'listings' | 'messages'>('listings');
  const [reservationTab, setReservationTab] = useState<'today' | 'upcoming'>('today');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [hostListings, setHostListings] = useState<any[]>([]);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHostMenuOpen, setIsHostMenuOpen] = useState(false);
  const [copiedListingId, setCopiedListingId] = useState<number | null>(null);
  const [isNavigatingToCreate, setIsNavigatingToCreate] = useState(false);
  const [listingViewMode, setListingViewMode] = useState<'grid' | 'list'>('grid');

  const handleShareListing = async (l: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/listings/${l.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedListingId(l.id);
      showToast('Listing link copied to clipboard!', 'success');
      setTimeout(() => {
        setCopiedListingId((prev) => (prev === l.id ? null : prev));
      }, 2000);
    } catch (_) {
      showToast('Failed to copy link', 'error');
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [dash, listings] = await Promise.all([
          apiGetHostDashboard(currentUser.id).catch(() => null),
          apiGetHostListings(currentUser.id).catch(() => [])
        ]);
        setDashboardData(dash);
        setHostListings(listings || []);
      } catch (err: any) {
        showToast(err.message || 'Failed to load host dashboard', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [currentUser]);

  const [deletingListing, setDeletingListing] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteListing = async () => {
    if (!deletingListing) return;
    try {
      setIsDeleting(true);
      await apiDeleteListing(deletingListing.id, currentUser?.id);
      showToast(`"${deletingListing.title || 'Listing'}" removed successfully`, 'success');
      setHostListings((prev) => prev.filter((item) => item.id !== deletingListing.id));
      setDeletingListing(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove listing', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const todayReservations = dashboardData?.today_reservations || [];
  const upcomingReservations = dashboardData?.upcoming_reservations || [];
  const displayedReservations = reservationTab === 'today' ? todayReservations : upcomingReservations;

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header matching Airbnb Host Screenshot */}
      <header className="relative px-6 md:px-12 h-20 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#121212] z-30">
        {/* Logo */}
        <Link href="/" aria-label="Airbnb Home" className="z-10">
          <svg className="w-8 h-8 text-airbnb-red fill-current" viewBox="0 0 32 32">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.905 0-5.464-1.808-6.906-4.542l-.094-.185-.094.185c-1.442 2.734-4.001 4.542-6.906 4.542-4.209 0-7.5-3.798-7.5-7.806 0-1.07.25-2.02.971-3.711l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.235 0-2.235.656-3.263 2.508l-.427.822c-1.89 3.705-5.975 12.28-6.924 14.502l-.128.312c-.596 1.424-.758 2.115-.758 2.856 0 2.972 2.378 5.806 5.5 5.806 2.392 0 4.521-1.636 5.586-4.148l.414-.975.414.975c1.065 2.512 3.194 4.148 5.586 4.148 3.122 0 5.5-2.834 5.5-5.806 0-.741-.162-1.432-.758-2.856l-.128-.312c-.949-2.222-5.034-10.797-6.924-14.502l-.427-.822C18.235 3.656 17.235 3 16 3zm0 13c1.657 0 3 1.343 3 3 0 2.137-1.666 4.29-3 5.485-1.334-1.195-3-3.348-3-5.485 0-1.657 1.343-3 3-3zm0 2c-.552 0-1 .448-1 1 0 .977.893 2.36 1 2.871.107-.511 1-1.894 1-2.871 0-.552-.448-1-1-1z" />
          </svg>
        </Link>

        {/* Navigation Tabs: Today, Calendar, Listings, Messages */}
        <nav className="hidden md:flex items-center gap-8 font-semibold text-sm absolute left-1/2 -translate-x-1/2">
          {(['today', 'calendar', 'listings', 'messages'] as const).map((tab) => {
            const isActive = activeNavTab === tab;
            const label = tab === 'listings' ? `Listings (${hostListings.length})` : tab.charAt(0).toUpperCase() + tab.slice(1);
            return (
              <button
                key={tab}
                onClick={() => setActiveNavTab(tab)}
                className={`py-6 relative transition-colors duration-200 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'text-black dark:text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>{label}</span>
                {tab === 'messages' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Coming soon
                  </span>
                )}
                {/* Framer Motion Active Sliding Bottom Line Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeHostTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black dark:bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Corner Controls */}
        <div className="flex items-center gap-3 z-10">
          <Link
            href="/"
            className="px-4 py-2 text-xs md:text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-full transition-colors cursor-pointer"
          >
            Switch to travelling
          </Link>

          {/* Host Hamburger Menu Button matching Traveller dropdown */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsHostMenuOpen((prev) => !prev);
            }}
            className="flex items-center gap-3 p-1.5 pl-3 border border-gray-300 dark:border-gray-700 hover:shadow-md rounded-full transition-all cursor-pointer bg-white dark:bg-[#1A1A1A]"
          >
            <MenuIcon className="w-4 h-4 text-gray-700 dark:text-gray-300 stroke-[2.5]" />
            <div className="w-8 h-8 rounded-full bg-[#222222] dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser?.name?.charAt(0).toUpperCase() || 'T'}
            </div>
          </button>
        </div>
      </header>

      {/* HOST FLOATING DROPDOWN MENU */}
      {isHostMenuOpen && (
        <>
          {/* Transparent Backdrop to capture clicks outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsHostMenuOpen(false)}
          />

          <div className="absolute right-6 md:right-12 top-16 mt-2 w-[300px] bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 py-3 z-50 font-medium text-sm text-airbnb-black dark:text-gray-100 animate-in fade-in zoom-in-95 duration-150 transform origin-top-right">
            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Host Account
              </div>
              <div className="text-sm font-bold text-airbnb-black dark:text-white truncate mt-0.5">
                {currentUser?.name || 'Host'}
              </div>
            </div>

            {/* 1. Create a new listing */}
            <button
              type="button"
              onClick={() => {
                setIsHostMenuOpen(false);
                router.push('/become-a-host/address');
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer font-semibold text-airbnb-black dark:text-gray-100"
            >
              <Plus className="w-4.5 h-4.5 text-airbnb-black dark:text-gray-200 stroke-[2.5]" />
              <span>Create a new listing</span>
            </button>

            {/* 2. Switch to travelling */}
            <Link
              href="/"
              onClick={() => setIsHostMenuOpen(false)}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer font-semibold text-airbnb-black dark:text-gray-100"
            >
              <Globe className="w-4.5 h-4.5 text-airbnb-black dark:text-gray-200 stroke-[2]" />
              <span>Switch to travelling</span>
            </Link>

            <div className="mx-4 border-t border-gray-100 dark:border-gray-800 my-1.5" />

            {/* 3. Log out */}
            <button
              type="button"
              onClick={() => {
                setIsHostMenuOpen(false);
                logout();
                showToast('Logged out successfully', 'info');
                router.push('/');
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer font-semibold text-rose-600 dark:text-rose-400"
            >
              <LogOut className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 stroke-[2]" />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-12 py-10 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeNavTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex flex-col items-center"
            >

            {/* Sub-filter Tabs: Today / Upcoming */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-gray-800 rounded-full mb-12">
              <button
                onClick={() => setReservationTab('today')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  reservationTab === 'today'
                    ? 'bg-gray-800 dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>Today</span>
                {todayReservations.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white">
                    {todayReservations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setReservationTab('upcoming')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  reservationTab === 'upcoming'
                    ? 'bg-gray-800 dark:bg-white text-white dark:text-black shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                <span>Upcoming</span>
                {upcomingReservations.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white">
                    {upcomingReservations.length}
                  </span>
                )}
              </button>
            </div>

            {/* Main Center Content */}
            {isLoading ? (
              <div className="py-20 text-center animate-pulse space-y-4">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl mx-auto" />
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mx-auto" />
              </div>
            ) : displayedReservations.length === 0 ? (
              /* Empty State matching Airbnb Screenshot */
              <div className="text-center py-12 max-w-md mx-auto">
                <div className="w-36 h-36 relative mx-auto mb-6 flex items-center justify-center">
                  <div className="w-32 h-36 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-[#262626] dark:to-[#1A1A1A] border border-amber-200 dark:border-gray-700 rounded-2xl shadow-sm rotate-3 flex flex-col p-3">
                    <div className="w-full h-1 bg-rose-400 rounded-full mb-2" />
                    <div className="grid grid-cols-2 gap-1 flex-1">
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded" />
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded" />
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded" />
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
                  You don't have any reservations
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8">
                  To get booked, you'll need to complete and publish your listing.
                </p>

                <button
                  onClick={() => router.push('/become-a-host/address')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-airbnb-black dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new listing</span>
                </button>
              </div>
            ) : (
              /* Populated Reservations List */
              <div className="w-full max-w-3xl space-y-4">
                {displayedReservations.map((res: any) => (
                  <div
                    key={res.id}
                    className="p-6 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xs hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                          {res.status}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Guest: {res.guest_name}</span>
                      </div>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">{res.listing_title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Dates: {res.check_in} → {res.check_out} ({res.guests} guests)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-base text-gray-900 dark:text-white">
                        {formatPrice(res.total_price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* CALENDAR TAB */}
        {activeNavTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <HostCalendar />
          </motion.div>
        )}

        {/* LISTINGS TAB */}
        {activeNavTab === 'listings' && (
          <motion.div
            key="listings"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-airbnb-black dark:text-white tracking-tight">
                {hostListings.length === 1 ? 'Your listing' : 'Your listings'}
              </h1>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title={listingViewMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
                  onClick={() => setListingViewMode(listingViewMode === 'grid' ? 'list' : 'grid')}
                  className="w-10 h-10 rounded-full bg-[#EBEBEB] dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                >
                  {listingViewMode === 'grid' ? (
                    <Grid className="w-5 h-5" />
                  ) : (
                    <List className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  title="Create new listing"
                  disabled={isNavigatingToCreate}
                  onClick={() => {
                    setIsNavigatingToCreate(true);
                    router.push('/become-a-host/address');
                  }}
                  className="w-10 h-10 rounded-full bg-[#EBEBEB] dark:bg-[#262626] hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs disabled:opacity-70"
                >
                  {isNavigatingToCreate ? (
                    <Loader2 className="w-5 h-5 stroke-[2.5] animate-spin text-airbnb-red" />
                  ) : (
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  )}
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className={listingViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl" : "flex flex-col gap-4 max-w-4xl"}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="border border-gray-200 dark:border-gray-800 rounded-3xl p-3 bg-white dark:bg-[#1A1A1A] animate-pulse space-y-3">
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-md" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded-md" />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-md" />
                  </div>
                ))}
              </div>
            ) : hostListings.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-gray-300 dark:border-gray-800 rounded-3xl p-8 bg-gray-50 dark:bg-[#1A1A1A] max-w-lg mx-auto">
                <Home className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">No listings created yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Start onboarding to list your home or apartment for guests worldwide.
                </p>
                <button
                  onClick={() => router.push('/become-a-host/address')}
                  className="px-6 py-3 bg-airbnb-black dark:bg-white text-white dark:text-black font-bold text-xs rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Start hosting
                </button>
              </div>
            ) : (
              <div className={listingViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl" : "flex flex-col gap-4 max-w-4xl"}>
                {hostListings.map((l: any) => {
                  const isPublished = l.status === 'PUBLISHED' || l.is_published;
                  const displayCover = l.cover_image || null;
                  const propType = l.property_type || 'Home';
                  const locText = l.location || 'Greater Noida, India';

                  return (
                    <div
                      key={l.id}
                      className={`group cursor-pointer border border-gray-200 dark:border-gray-800 rounded-3xl p-3 bg-white dark:bg-[#1A1A1A] hover:shadow-lg transition-all ${
                        listingViewMode === 'list' ? 'flex flex-col sm:flex-row gap-5 items-center' : 'flex flex-col'
                      }`}
                    >
                      {/* Image Container with Top-Left Pill Badge matching screenshots */}
                      <div
                        onClick={() => router.push(`/listings/${l.id}`)}
                        className={`aspect-[4/3] rounded-2xl overflow-hidden bg-[#DDDDDD] dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-xs relative ${
                          listingViewMode === 'list' ? 'w-full sm:w-64 flex-shrink-0' : 'w-full'
                        }`}
                      >
                        {displayCover ? (
                          <img
                            src={displayCover}
                            alt={l.title || 'Property image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#DDDDDD] dark:bg-gray-800 flex items-center justify-center text-gray-400 font-bold" />
                        )}

                        <div className="absolute top-3 left-3 z-10">
                          {isPublished ? (
                            <div className="bg-white/95 dark:bg-black/90 backdrop-blur-md text-gray-900 dark:text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-transparent dark:border-gray-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span>Published</span>
                            </div>
                          ) : (
                            <div className="bg-white/95 dark:bg-black/90 backdrop-blur-md text-gray-900 dark:text-white font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs border border-transparent dark:border-gray-700">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span>In progress</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className={`flex-1 flex flex-col justify-between ${listingViewMode === 'list' ? 'mt-0 w-full' : 'mt-3'}`}>
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <h3
                              onClick={() => router.push(`/listings/${l.id}`)}
                              className="font-extrabold text-base text-[#222222] dark:text-white leading-tight line-clamp-1 hover:underline"
                            >
                              {isPublished
                                ? l.title || 'Untitled listing'
                                : `Your listing started on ${
                                    l.created_at
                                      ? new Date(l.created_at).toLocaleDateString('en-GB', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })
                                      : '7 September 2026'
                                  }`}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1.5 line-clamp-1">
                            {propType} in {locText}
                          </p>
                        </div>

                        {/* Host Controls: Edit, Share & Remove Buttons */}
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingListing(l);
                            }}
                            className="flex-1 max-w-[140px] py-2 px-4 bg-gray-100 dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleShareListing(l, e)}
                            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                              copiedListingId === l.id
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 scale-105'
                                : 'bg-gray-100 dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                            title="Copy listing link"
                          >
                            {copiedListingId === l.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3] animate-in zoom-in-75 duration-200" />
                            ) : (
                              <Share className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingListing(l);
                            }}
                            className="py-2 px-3.5 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            title="Remove listing from Airbnb"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* MESSAGES TAB */}
        {activeNavTab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex flex-col md:flex-row min-h-[500px]"
          >
            {/* Left Sidebar Panel */}
            <div className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 pr-0 md:pr-10 pb-8 md:pb-0 flex flex-col justify-between">
              <div>
                {/* Header: Title + Search & Settings Buttons */}
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                    Messages
                  </h1>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="Search messages"
                      className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Message settings"
                      className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 3D Chat Bubble Graphic & Message */}
                <div className="flex flex-col items-center text-center py-10 my-4">
                  {/* Layered 3D Chat Bubble Graphic matching reference screenshot */}
                  <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                    {/* Back Blue Bubble */}
                    <div className="absolute right-2 top-1 w-20 h-20 bg-gradient-to-tr from-sky-500 to-sky-400 rounded-3xl shadow-md rotate-6 transform translate-x-2 -translate-y-1" />
                    {/* Front White Bubble */}
                    <div className="relative w-22 h-22 bg-white dark:bg-[#262626] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-center space-y-2 transform -rotate-3 z-10">
                      <div className="w-8 h-2 bg-sky-400 rounded-full" />
                      <div className="w-12 h-2 bg-sky-400 rounded-full" />
                    </div>
                  </div>

                  <h2 className="text-xl font-extrabold text-[#222222] dark:text-white mb-2">
                    Your inbox is empty
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[240px] leading-relaxed">
                    Come back soon for conversations with your guests.
                  </p>
                </div>
              </div>

              {/* Bottom Section: Past Conversations Link */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span>Past conversations</span>
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Main Panel (Empty / Coming Soon Preview) */}
            <div className="flex-1 hidden md:flex items-center justify-center p-12 text-center">
              <div className="max-w-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#222222] dark:text-white">Messages coming soon</h3>
                <p className="text-xs text-gray-400 dark:text-gray-400 leading-relaxed">
                  Real-time messaging between hosts and guests is under development and will be activated shortly.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Edit Listing Modal */}
      <EditListingModal
        isOpen={Boolean(editingListing)}
        listing={editingListing}
        onClose={() => setEditingListing(null)}
        onUpdated={(updatedListing) => {
          setHostListings((prev) =>
            prev.map((item) => (item.id === updatedListing.id ? { ...item, ...updatedListing } : item))
          );
        }}
      />

      {/* CUSTOM SLEEK CONFIRMATION MODAL (REPLACES BROWSER ALERT) */}
      {deletingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white dark:bg-[#1C1C1E] text-airbnb-black dark:text-gray-100 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Remove listing?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-900 dark:text-white">"{deletingListing.title || 'this listing'}"</span>? It will be unpublished and hidden from guests, but historical bookings will be preserved.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingListing(null)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteListing}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Yes, remove listing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
