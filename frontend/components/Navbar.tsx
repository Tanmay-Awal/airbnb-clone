'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Globe, Menu, User as UserIcon, Heart, Compass, Luggage, Building2, ChevronDown, Check, Sun, Moon, LogOut, HelpCircle, Bell, Settings, MessageSquare, Navigation, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLocale } from '@/context/LocaleContext';
import { useToast } from '@/components/Toast';

interface NavbarProps {
  onOpenSearchModal?: () => void;
  locationFilter?: string;
  guestsFilter?: number;
  activeTopTab?: 'all' | 'homes' | 'experiences' | 'services';
  onTopTabChange?: (tab: 'all' | 'homes' | 'experiences' | 'services') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearchModal,
  locationFilter,
  guestsFilter,
  activeTopTab: propTopTab,
  onTopTabChange,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, currentUser, setShowLoginModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, currency, openModal: openLocaleModal } = useLocale();
  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNavigatingHost, setIsNavigatingHost] = useState(false);

  const handleBecomeAHostClick = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in or sign up to become a host', 'info');
    } else {
      setIsNavigatingHost(true);
      if (currentUser?.role?.toLowerCase() === 'host') {
        router.push('/hosting');
      } else {
        router.push('/become-a-host/address');
      }
      setTimeout(() => setIsNavigatingHost(false), 1200);
    }
  };

  const toggleMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
      setTimeout(() => setIsMenuVisible(true), 15);
    } else {
      setIsMenuVisible(false);
      setTimeout(() => setIsMenuOpen(false), 200);
    }
  };

  const closeMenu = () => {
    setIsMenuVisible(false);
    setTimeout(() => setIsMenuOpen(false), 200);
  };

  const [internalTopTab, setInternalTopTab] = useState<'all' | 'homes' | 'experiences' | 'services'>('all');

  const activeTopTab = propTopTab !== undefined ? propTopTab : internalTopTab;

  const handleTabClick = (tab: 'all' | 'homes' | 'experiences' | 'services') => {
    if (onTopTabChange) {
      onTopTabChange(tab);
    } else {
      setInternalTopTab(tab);
    }
  };

  // Inline Search Popover State
  const [activePopover, setActivePopover] = useState<'where' | 'when' | 'who' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationFilter || '');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [adults, setAdults] = useState<number>(guestsFilter || 1);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [infantsCount, setInfantsCount] = useState<number>(0);
  const [guests, setGuests] = useState<number>(guestsFilter || 1);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    setSelectedLocation(locationFilter || '');
  }, [locationFilter]);

  React.useEffect(() => {
    setGuests(guestsFilter || 1);
    setAdults(guestsFilter || 1);
  }, [guestsFilter]);

  const totalGuests = adults + childrenCount;

  const handleClearAllSearch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedLocation('');
    setCheckIn('');
    setCheckOut('');
    setAdults(1);
    setChildrenCount(0);
    setInfantsCount(0);
    setGuests(1);
    setActivePopover(null);
    setIsExpandedSearchOpen(false);
    if (onTopTabChange) {
      onTopTabChange('all');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    router.push('/');
  };

  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }

    setIsLocating(true);
    showToast('Fetching your location...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.city_district || addr.county || 'Noida';
            const state = addr.state || 'Uttar Pradesh';
            const formattedLoc = `${city}, ${state}`;
            
            setSelectedLocation(formattedLoc);
            showToast(`Location set to ${formattedLoc}`, 'success');
            setActivePopover('when');
          } else {
            setSelectedLocation('Noida, Uttar Pradesh');
            showToast('Location set to Noida, Uttar Pradesh', 'info');
            setActivePopover('when');
          }
        } catch {
          setSelectedLocation('Noida, Uttar Pradesh');
          showToast('Location set to Noida, Uttar Pradesh', 'info');
          setActivePopover('when');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          showToast('Location permission denied. Defaulting to Noida, Uttar Pradesh', 'info');
        } else {
          showToast('Could not fetch location. Defaulting to Noida', 'info');
        }
        setSelectedLocation('Noida, Uttar Pradesh');
        setActivePopover('when');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  // Flexible Date Tab state for When popover
  const [whenTab, setWhenTab] = useState<'dates' | 'flexible'>('dates');
  const [flexibleDuration, setFlexibleDuration] = useState<'weekend' | 'week' | 'month' | null>(null);
  const [flexibleMonth, setFlexibleMonth] = useState<string | null>(null);
  const [dateFlexibility, setDateFlexibility] = useState<string>('exact');
  const [calendarBaseMonth, setCalendarBaseMonth] = useState<number>(0);
  const monthScrollRef = React.useRef<HTMLDivElement>(null);

  // Check page routes to render appropriate header state
  const isListingDetail = pathname ? pathname.startsWith('/listings/') : false;
  const isHostPage = pathname ? pathname.startsWith('/host') : false;
  const isSearchPage = pathname ? pathname.startsWith('/search') : false;
  const isWishlistPage = pathname ? pathname.startsWith('/wishlist') : false;
  const isProfilePage = pathname ? pathname.startsWith('/profile') : false;
  const isTripsPage = pathname ? pathname.startsWith('/trips') : false;
  const isBookPage = pathname ? pathname.startsWith('/book') : false;

  const [isExpandedSearchOpen, setIsExpandedSearchOpen] = useState(false);
  const isSubpage = isListingDetail || isHostPage || isWishlistPage || isProfilePage || isTripsPage || isBookPage || isSearchPage;
  const hasActiveSearchFilter = Boolean(locationFilter || (guestsFilter && guestsFilter > 1));
  const isCompactHeaderState = isScrolled || isSubpage || hasActiveSearchFilter;
  const isSearchOpen = isExpandedSearchOpen || activePopover !== null;

  React.useEffect(() => {
    const handleScroll = (e?: Event) => {
      // Ignore scroll events originating from inner popovers/modals
      if (e?.target && e.target !== document && e.target !== document.documentElement && e.target !== document.body) {
        return;
      }
      let currentScroll = window.scrollY || document.documentElement.scrollTop;
      if (currentScroll > 20) {
        setIsScrolled(true);
        if (!isExpandedSearchOpen) {
          setActivePopover(null);
        }
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [pathname, isExpandedSearchOpen]);

  const suggestedDestinations = [
    { name: 'Gurgaon District, Haryana', subtitle: 'Near you', icon: '🏛️' },
    { name: 'New Delhi, Delhi', subtitle: 'For sights like India Gate', icon: '🏢' },
    { name: 'North Goa, Goa', subtitle: 'Popular beach destination', icon: '🏖️' },
    { name: 'Varanasi, Uttar Pradesh', subtitle: 'A hidden gem', icon: '🛕' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#1A1A1A] border-b border-airbnb-border dark:border-gray-800 transition-colors duration-200">
      {/* Backdrop overlay when popover or menu or expanded search is open */}
      {(activePopover || isMenuOpen || isExpandedSearchOpen) && (
        <div
          onClick={() => {
            setActivePopover(null);
            setIsExpandedSearchOpen(false);
            closeMenu();
          }}
          className="fixed inset-0 bg-black/25 z-30 transition-opacity animate-in fade-in duration-200"
        />
      )}

      {/* Top Header Row */}
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4 relative z-50">
        <Link
          href="/"
          onClick={(e) => handleClearAllSearch(e)}
          className="flex items-center gap-2 text-airbnb-red font-bold text-2xl tracking-tight flex-shrink-0 z-10 cursor-pointer"
        >
          <svg className="w-8 h-8 fill-current" viewBox="0 0 32 32">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.905 0-5.464-1.808-6.906-4.542l-.094-.185-.094.185c-1.442 2.734-4.001 4.542-6.906 4.542-4.209 0-7.5-3.798-7.5-7.806 0-1.07.25-2.02.971-3.711l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.235 0-2.235.656-3.263 2.508l-.427.822c-1.89 3.705-5.975 12.28-6.924 14.502l-.128.312c-.596 1.424-.758 2.115-.758 2.856 0 2.972 2.378 5.806 5.5 5.806 2.392 0 4.521-1.636 5.586-4.148l.414-.975.414.975c1.065 2.512 3.194 4.148 5.586 4.148 3.122 0 5.5-2.834 5.5-5.806 0-.741-.162-1.432-.758-2.856l-.128-.312c-.949-2.222-5.034-10.797-6.924-14.502l-.427-.822C18.235 3.656 17.235 3 16 3zm0 13c1.657 0 3 1.343 3 3 0 2.137-1.666 4.29-3 5.485-1.334-1.195-3-3.348-3-5.485 0-1.657 1.343-3 3-3zm0 2c-.552 0-1 .448-1 1 0 .977.893 2.36 1 2.871.107-.511 1-1.894 1-2.871 0-.552-.448-1-1-1z" />
          </svg>
          <span className="hidden sm:inline">airbnb</span>
        </Link>

        {/* Center Section: Category Tabs (when at top of page) OR Compact Search Pill (when scrolled or on search page) */}
        <div className="flex-1 flex justify-center items-center px-1 sm:px-4 md:pl-8 pointer-events-auto translate-x-0 md:translate-x-16 relative h-12 overflow-hidden">
          {/* Top Category Switcher Tabs (Shown ONLY on Homepage when at top and no search filter active) */}
          <div
            className={`hidden md:flex items-center gap-8 text-sm font-semibold text-airbnb-black dark:text-gray-100 transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] ${!isCompactHeaderState && !isSearchOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-8 pointer-events-none absolute'
              }`}
          >
            <button
              onClick={() => handleTabClick('all')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${activeTopTab === 'all' ? 'border-black dark:border-white font-bold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
            >
              <img src="/cat_all.png" alt="All" className="w-7 h-7 object-contain drop-shadow-xs" />
              <span>All</span>
            </button>
            <button
              onClick={() => handleTabClick('homes')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${activeTopTab === 'homes' ? 'border-black dark:border-white font-bold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
            >
              <img src="/cat_homes.png" alt="Homes" className="w-7 h-7 object-contain drop-shadow-xs" />
              <span>Homes</span>
            </button>
            <button
              onClick={() => handleTabClick('experiences')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${activeTopTab === 'experiences' ? 'border-black dark:border-white font-bold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
            >
              <img src="/cat_experiences.png" alt="Experiences" className="w-7 h-7 object-contain drop-shadow-xs" />
              <span>Experiences</span>
            </button>
            <button
              onClick={() => handleTabClick('services')}
              className={`flex items-center gap-2 pb-2 border-b-2 transition-all cursor-pointer ${activeTopTab === 'services' ? 'border-black dark:border-white font-bold opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
            >
              <img src="/cat_services.png" alt="Services" className="w-7 h-7 object-contain drop-shadow-xs" />
              <span>Services</span>
            </button>
          </div>

          {/* Compact Search Pill (Shown when scrolled, on subpages, or when search filter is active) */}
          <div
            className={`flex items-center border border-airbnb-border dark:border-gray-700 shadow-sm hover:shadow-md rounded-full py-1.5 px-2 transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] cursor-pointer bg-white dark:bg-[#262626] text-sm text-airbnb-black dark:text-gray-100 w-auto ${isCompactHeaderState && !isSearchOpen
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-90 translate-y-3 pointer-events-none absolute'
              }`}
          >
            {/* 1. Where / Destination */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedSearchOpen(true);
                setActivePopover(activePopover === 'where' ? null : 'where');
              }}
              className="flex items-center gap-2 pl-2 pr-4 border-r border-airbnb-border dark:border-gray-700 hover:opacity-75 transition-opacity"
            >
              <span className="text-base leading-none">🏠</span>
              <span className="font-semibold text-airbnb-black dark:text-white whitespace-nowrap">
                {selectedLocation || 'Anywhere'}
              </span>
            </div>

            {/* 2. When / Dates */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedSearchOpen(true);
                setActivePopover(activePopover === 'when' ? null : 'when');
              }}
              className="px-4 border-r border-airbnb-border dark:border-gray-700 hover:opacity-75 transition-opacity"
            >
              <span className="font-semibold text-airbnb-black dark:text-white whitespace-nowrap">
                {checkIn ? 'Any week' : 'Anytime'}
              </span>
            </div>

            {/* 3. Who / Guests */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedSearchOpen(true);
                setActivePopover(activePopover === 'who' ? null : 'who');
              }}
              className="pl-4 pr-2 hover:opacity-75 transition-opacity"
            >
              <span className="font-semibold text-airbnb-black dark:text-white whitespace-nowrap">
                {guests > 1 ? `${guests} guests` : 'Add guests'}
              </span>
            </div>

            {/* Search Icon Button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedSearchOpen(true);
                setActivePopover('where');
              }}
              className="bg-airbnb-red hover:bg-airbnb-darkRed text-white p-2 rounded-full flex-shrink-0 ml-1 hover:scale-105 transition-transform"
            >
              <Search className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Right Actions: Become a host | Profile Button | Hamburger Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBecomeAHostClick}
            disabled={isNavigatingHost}
            className="hidden sm:flex items-center gap-2 text-sm font-bold hover:bg-airbnb-lightGrey dark:hover:bg-[#262626] px-4 py-2.5 rounded-full transition-all text-airbnb-black dark:text-gray-100 cursor-pointer disabled:opacity-75"
          >
            {isNavigatingHost && <Loader2 className="w-3.5 h-3.5 animate-spin text-airbnb-red" />}
            <span>{currentUser?.role?.toLowerCase() === 'host' ? 'Switch to hosting' : 'Become a host'}</span>
          </button>

          <button
            onClick={() => {
              if (isLoggedIn) {
                router.push('/profile');
              } else {
                setShowLoginModal(true);
              }
            }}
            aria-label="Profile"
            className="w-10 h-10 rounded-full bg-[#EBEBEB] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors cursor-pointer text-airbnb-black dark:text-gray-100 font-bold overflow-hidden"
          >
            {isLoggedIn && currentUser?.name ? (
              <span className="w-full h-full bg-airbnb-red text-white flex items-center justify-center font-extrabold text-base tracking-tight select-none">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-full hover:bg-airbnb-lightGrey dark:hover:bg-[#262626] transition-colors cursor-pointer text-airbnb-black dark:text-gray-200"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => toggleMenu()}
              aria-label="Menu"
              className="w-10 h-10 rounded-full bg-[#EBEBEB] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors cursor-pointer text-airbnb-black dark:text-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className={`absolute right-0 mt-2 w-[320px] bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-2xl border border-airbnb-border dark:border-gray-800 py-3 z-[100] font-medium text-sm text-airbnb-black dark:text-gray-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-top-right ${isMenuVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                {!isLoggedIn ? (
                  <>
                    {/* 1. Currency */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        openLocaleModal('currency');
                      }}
                      className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4.5 h-4.5 text-airbnb-black dark:text-gray-200" />
                        <span className="font-semibold text-airbnb-black dark:text-gray-100">Currency ({currency.code})</span>
                      </div>
                    </button>

                    <div className="border-t border-airbnb-border dark:border-gray-800 my-1"></div>

                    {/* 2. Become a host card */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleBecomeAHostClick();
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F7F7F7] dark:bg-[#262626] hover:bg-[#EBEBEB] dark:hover:bg-[#333333] transition-colors my-1 cursor-pointer text-left"
                    >
                      <div className="max-w-[180px]">
                        <div className="font-bold text-airbnb-black dark:text-white text-sm">Become a host</div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5 font-normal leading-snug">
                          It's easy to start hosting and earn extra income.
                        </div>
                      </div>
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-2xl">
                        🙋‍♀️
                      </div>
                    </button>

                    <div className="border-t border-airbnb-border dark:border-gray-800 my-1"></div>

                    {/* 3. Log in or sign up */}
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowLoginModal(true);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-white cursor-pointer"
                    >
                      Log in or sign up
                    </button>
                  </>
                ) : (
                  <>
                    {/* 1. Wishlists */}
                    <Link
                      href="/wishlist"
                      onClick={() => closeMenu()}
                      className="flex items-center gap-4 px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-gray-100 transition-colors"
                    >
                      <Heart className="w-5 h-5 text-airbnb-black dark:text-gray-200 stroke-[1.75] flex-shrink-0" />
                      <span>Wishlists</span>
                    </Link>

                    {/* 2. Trips */}
                    <Link
                      href="/trips"
                      onClick={() => closeMenu()}
                      className="flex items-center gap-4 px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5 text-airbnb-black dark:text-gray-200 fill-current flex-shrink-0" viewBox="0 0 32 32">
                        <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.905 0-5.464-1.808-6.906-4.542l-.094-.185-.094.185c-1.442 2.734-4.001 4.542-6.906 4.542-4.209 0-7.5-3.798-7.5-7.806 0-1.07.25-2.02.971-3.711l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.235 0-2.235.656-3.263 2.508l-.427.822c-1.89 3.705-5.975 12.28-6.924 14.502l-.128.312c-.596 1.424-.758 2.115-.758 2.856 0 2.972 2.378 5.806 5.5 5.806 2.392 0 4.521-1.636 5.586-4.148l.414-.975.414.975c1.065 2.512 3.194 4.148 5.586 4.148 3.122 0 5.5-2.834 5.5-5.806 0-.741-.162-1.432-.758-2.856l-.128-.312c-.949-2.222-5.034-10.797-6.924-14.502l-.427-.822C18.235 3.656 17.235 3 16 3zm0 13c1.657 0 3 1.343 3 3 0 2.137-1.666 4.29-3 5.485-1.334-1.195-3-3.348-3-5.485 0-1.657 1.343-3 3-3zm0 2c-.552 0-1 .448-1 1 0 .977.893 2.36 1 2.871.107-.511 1-1.894 1-2.871 0-.552-.448-1-1-1z" />
                      </svg>
                      <span>Trips</span>
                    </Link>

                    {/* 3. Messages */}
                    <div
                      className="w-full flex items-center justify-between px-6 py-2.5 font-semibold text-airbnb-black/70 dark:text-gray-400 select-none opacity-80 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500 stroke-[1.75] flex-shrink-0" />
                        <span>Messages</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 shadow-xs tracking-tight">
                        Coming soon
                      </span>
                    </div>

                    {/* 4. Profile */}
                    <Link
                      href="/profile"
                      onClick={() => closeMenu()}
                      className="flex items-center gap-4 px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-gray-100 transition-colors"
                    >
                      <UserIcon className="w-5 h-5 text-airbnb-black dark:text-gray-200 stroke-[1.75] flex-shrink-0" />
                      <span>Profile</span>
                    </Link>

                    <div className="mx-6 border-t border-gray-200 dark:border-gray-800 my-2" />

                    {/* 5. Notifications */}
                    <div
                      className="w-full flex items-center justify-between px-6 py-2.5 font-semibold text-airbnb-black/70 dark:text-gray-400 select-none opacity-80 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500 stroke-[1.75] flex-shrink-0" />
                        <span>Notifications</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50 shadow-xs tracking-tight">
                        Coming soon
                      </span>
                    </div>

                    <div className="mx-6 border-t border-gray-200 dark:border-gray-800 my-2" />

                    {/* 6. Currency */}
                    <button
                      onClick={() => {
                        closeMenu();
                        openLocaleModal('currency');
                      }}
                      className="w-full text-left flex items-center gap-4 px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-gray-100 transition-colors cursor-pointer"
                    >
                      <Globe className="w-5 h-5 text-airbnb-black dark:text-gray-200 stroke-[1.75] flex-shrink-0" />
                      <span>Currency ({currency.code})</span>
                    </button>

                    <div className="mx-6 border-t border-gray-200 dark:border-gray-800 my-2" />

                    {/* 9. Host card */}
                    <button
                      onClick={() => {
                        closeMenu();
                        handleBecomeAHostClick();
                      }}
                      className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors my-1 cursor-pointer text-left"
                    >
                      <div className="max-w-[190px]">
                        <div className="font-bold text-airbnb-black dark:text-white text-sm">
                          {currentUser?.role?.toLowerCase() === 'host' ? "Host Dashboard" : "Become a host"}
                        </div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5 font-normal leading-snug">
                          {currentUser?.role?.toLowerCase() === 'host' ? "Manage your listings and reservations." : "It's easy to start hosting and earn extra income."}
                        </div>
                      </div>
                      <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-xl">
                        🏡
                      </div>
                    </button>
                    <div className="mx-6 border-t border-gray-200 dark:border-gray-800 my-2" />

                    {/* 10. Log out */}
                    <button
                      onClick={() => {
                        closeMenu();
                        logout();
                        showToast('Logged out successfully', 'info');
                      }}
                      className="w-full text-left px-6 py-2.5 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] font-semibold text-airbnb-black dark:text-white transition-colors cursor-pointer"
                    >
                      Log out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Expanded Search Bar Pill (Opens/collapses with center squeeze & upward fade) */}
      <div
        className={`transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] px-4 md:pl-8 relative z-30 ${isSearchOpen || !isCompactHeaderState
          ? 'max-h-[140px] opacity-100 pb-6 mb-4 scale-100 translate-y-0 overflow-visible pointer-events-auto'
          : 'max-h-0 opacity-0 pb-0 mb-0 scale-95 -translate-y-8 pointer-events-none overflow-hidden'
          }`}
      >
        {/* Search Pill — collapses horizontally to center & fades upward */}
        <div
          className={`max-w-3xl mx-auto bg-[#EBEBEB] dark:bg-[#262626] border border-airbnb-border dark:border-gray-700 rounded-full shadow-airbnb-search p-1.5 flex items-center justify-between text-airbnb-black dark:text-gray-100 relative transition-all duration-350 ease-[cubic-bezier(0.2,0,0,1)] origin-top ${isSearchOpen || !isCompactHeaderState
            ? 'scale-100 translate-y-0 opacity-100'
            : 'scale-y-75 scale-x-80 -translate-y-6 opacity-0'
            }`}
        >

          {/* Where Section */}
          <div
            onClick={() => setActivePopover(activePopover === 'where' ? null : 'where')}
            className={`flex-1 px-6 py-2 rounded-full cursor-pointer transition-all ${activePopover === 'where'
              ? 'bg-white dark:bg-[#1A1A1A] shadow-md'
              : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
          >
            <div className="text-[11px] font-bold text-airbnb-black dark:text-gray-100">Where</div>
            <input
              type="text"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  setIsExpandedSearchOpen(false);
                  setActivePopover(null);
                  const queryParams = new URLSearchParams();
                  if (selectedLocation) queryParams.set('location', selectedLocation);
                  if (guests > 1) queryParams.set('guests', guests.toString());
                  if (checkIn) queryParams.set('check_in', checkIn);
                  if (checkOut) queryParams.set('check_out', checkOut);
                  const searchStr = queryParams.toString();
                  router.push(`/${searchStr ? '?' + searchStr : ''}`);
                }
              }}
              placeholder="Search destinations"
              className="w-full text-xs bg-transparent border-none focus:outline-none text-airbnb-black dark:text-white placeholder:text-airbnb-grey dark:placeholder:text-gray-400 font-normal truncate"
            />
          </div>

          {/* When Section */}
          <div
            onClick={() => setActivePopover(activePopover === 'when' ? null : 'when')}
            className={`flex-1 px-6 py-2 rounded-full cursor-pointer transition-all border-l border-airbnb-border dark:border-gray-700 ${activePopover === 'when'
              ? 'bg-white dark:bg-[#1A1A1A] shadow-md'
              : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
          >
            <div className="text-[11px] font-bold text-airbnb-black dark:text-gray-100">When</div>
            <div className="text-xs text-airbnb-grey dark:text-gray-400 truncate">
              {whenTab === 'flexible'
                ? (flexibleDuration || flexibleMonth)
                  ? `${flexibleDuration ? flexibleDuration.charAt(0).toUpperCase() + flexibleDuration.slice(1) : 'Any duration'} in ${flexibleMonth ? flexibleMonth.split(' ')[0] : 'Anytime'}`
                  : 'Anytime'
                : checkIn
                  ? `${checkIn} → ${checkOut || 'Add date'}`
                  : 'Add dates'}
            </div>
          </div>

          {/* Who Section & Search Button */}
          <div
            onClick={() => setActivePopover(activePopover === 'who' ? null : 'who')}
            className={`flex-1 pl-6 pr-2 py-2 rounded-full cursor-pointer transition-all border-l border-airbnb-border dark:border-gray-700 flex items-center justify-between ${activePopover === 'who'
              ? 'bg-white dark:bg-[#1A1A1A] shadow-md'
              : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`}
          >
            <div>
              <div className="text-[11px] font-bold text-airbnb-black dark:text-gray-100">Who</div>
              <div className="text-xs text-airbnb-grey dark:text-gray-400 truncate">
                {totalGuests > 1
                  ? `${totalGuests} guests${infantsCount > 0 ? `, ${infantsCount} infant${infantsCount > 1 ? 's' : ''}` : ''}`
                  : totalGuests === 1
                    ? `1 guest${infantsCount > 0 ? `, ${infantsCount} infant${infantsCount > 1 ? 's' : ''}` : ''}`
                    : 'Add guests'}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {(selectedLocation || checkIn || checkOut || totalGuests > 1 || infantsCount > 0) && (
                <button
                  type="button"
                  onClick={handleClearAllSearch}
                  className="text-xs font-bold text-airbnb-grey dark:text-gray-400 hover:text-airbnb-red transition-colors px-3 py-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer whitespace-nowrap"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                disabled={isSearching}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSearching(true);
                  setIsExpandedSearchOpen(false);
                  setActivePopover(null);
                  const queryParams = new URLSearchParams();
                  if (selectedLocation) queryParams.set('location', selectedLocation);
                  if (totalGuests > 1) queryParams.set('guests', totalGuests.toString());
                  if (checkIn) queryParams.set('check_in', checkIn);
                  if (checkOut) queryParams.set('check_out', checkOut);
                  const searchStr = queryParams.toString();
                  router.push(`/${searchStr ? '?' + searchStr : ''}`);
                  setTimeout(() => setIsSearching(false), 800);
                }}
                className="bg-airbnb-red hover:bg-airbnb-darkRed disabled:opacity-80 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-bold text-xs transition-all hover:scale-105 shadow-md ml-1 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
          {/* UNIFIED SLIDING POPOVER — single container that transitions position/width when switching tabs */}
          {activePopover && (
            <div
              className="absolute top-full mt-3 bg-white dark:bg-[#1F1F1F] rounded-3xl p-6 shadow-airbnb-modal border border-airbnb-border dark:border-gray-800 z-50 overflow-y-auto max-h-[calc(100vh-140px)]"
              style={{
                left: activePopover === 'where' ? 0
                  : activePopover === 'when' ? 0
                    : 'calc(100% - 380px)',
                width: activePopover === 'when' ? '100%' : 380,
                transition: 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >

              {/* WHERE CONTENT */}
              {activePopover === 'where' && (
                <div className="animate-popover-left">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-airbnb-black dark:text-white mb-3 px-1">
                    SUGGESTED DESTINATIONS
                  </div>
                  <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto pr-1">
                    {/* Use current location option */}
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={isLocating}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] transition-colors text-left cursor-pointer group mb-1 border-b border-gray-100 dark:border-gray-800"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-airbnb-red flex items-center justify-center text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                        {isLocating ? (
                          <div className="w-5 h-5 border-2 border-airbnb-red border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5 fill-airbnb-red/20" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-airbnb-black dark:text-white leading-tight flex items-center gap-1.5">
                          <span>{isLocating ? 'Detecting location...' : 'Use current location'}</span>
                        </div>
                      </div>
                    </button>

                    {suggestedDestinations.map((dest) => (
                      <button
                        key={dest.name}
                        onClick={() => {
                          setSelectedLocation(dest.name);
                          setActivePopover('when');
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] transition-colors text-left cursor-pointer group ${selectedLocation === dest.name ? 'bg-airbnb-lightGrey dark:bg-[#2A2A2A]' : ''
                          }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg group-hover:scale-105 transition-transform flex-shrink-0">
                          {dest.icon}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-airbnb-black dark:text-white leading-tight">{dest.name}</div>
                          <div className="text-xs text-airbnb-grey dark:text-gray-400 mt-0.5">{dest.subtitle}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WHEN CONTENT */}
              {activePopover === 'when' && (
                <div className="animate-popover-center flex flex-col items-center max-h-[calc(100vh-200px)] overflow-y-auto pr-1">

                  {/* Top Switcher Pill: Dates | Flexible */}
                  <div className="bg-[#EBEBEB] dark:bg-[#2A2A2A] p-1 rounded-full flex items-center gap-1 mb-6 text-xs font-bold w-fit flex-shrink-0">
                    <button
                      onClick={() => setWhenTab('dates')}
                      className={`px-6 py-2 rounded-full transition-all cursor-pointer ${whenTab === 'dates'
                        ? 'bg-white dark:bg-[#1F1F1F] text-airbnb-black dark:text-white shadow-xs font-bold'
                        : 'text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                    >
                      Dates
                    </button>
                    <button
                      onClick={() => setWhenTab('flexible')}
                      className={`px-6 py-2 rounded-full transition-all cursor-pointer ${whenTab === 'flexible'
                        ? 'bg-white dark:bg-[#1F1F1F] text-airbnb-black dark:text-white shadow-xs font-bold'
                        : 'text-airbnb-grey dark:text-gray-400 hover:text-black dark:hover:text-white'
                        }`}
                    >
                      Flexible
                    </button>
                  </div>

                  {whenTab === 'dates' ? (
                    <>
                      {/* Dual Month Side-by-Side Grid */}
                      <div className="grid grid-cols-2 gap-10 w-full px-2">

                        {/* Month 1 */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => setCalendarBaseMonth(Math.max(0, calendarBaseMonth - 1))}
                              disabled={calendarBaseMonth === 0}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4 rotate-90 text-airbnb-black dark:text-white" />
                            </button>
                            <div className="font-bold text-sm text-airbnb-black dark:text-white">
                              {calendarBaseMonth === 0 ? 'September 2026' : calendarBaseMonth === 1 ? 'October 2026' : calendarBaseMonth === 2 ? 'November 2026' : 'December 2026'}
                            </div>
                            <div className="w-6" />
                          </div>
                          <div className="grid grid-cols-7 text-center text-xs font-semibold text-airbnb-grey dark:text-gray-400 mb-2">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          </div>
                          <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold">
                            {[...Array(calendarBaseMonth === 0 ? 2 : calendarBaseMonth === 1 ? 4 : calendarBaseMonth === 2 ? 0 : 2)].map((_, idx) => (
                              <div key={`empty-1-${idx}`} />
                            ))}
                            {[...Array(calendarBaseMonth === 0 ? 30 : calendarBaseMonth === 1 ? 31 : calendarBaseMonth === 2 ? 30 : 31)].map((_, i) => {
                              const day = i + 1;
                              const mNum = calendarBaseMonth + 9;
                              const dateStr = `2026-${mNum < 10 ? '0' + mNum : mNum}-${day < 10 ? '0' + day : day}`;
                              const todayISTStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                              const isPast = dateStr < todayISTStr;
                              const isCheckIn = checkIn === dateStr;
                              const isCheckOut = checkOut === dateStr;
                              const isSelected = isCheckIn || isCheckOut;
                              const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
                              return (
                                <button
                                  key={day}
                                  disabled={isPast}
                                  onClick={() => {
                                    if (isPast) return;
                                    if (!checkIn || (checkIn && checkOut)) { setCheckIn(dateStr); setCheckOut(''); }
                                    else if (dateStr > checkIn) { setCheckOut(dateStr); setActivePopover('who'); }
                                    else { setCheckIn(dateStr); }
                                  }}
                                  className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center transition-all ${isPast
                                    ? 'opacity-25 line-through cursor-not-allowed text-gray-400 dark:text-gray-600'
                                    : isSelected
                                      ? 'bg-[#222222] dark:bg-white text-white dark:text-black font-bold scale-105 shadow-xs cursor-pointer'
                                      : isInRange
                                        ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-none w-full cursor-pointer'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-black dark:text-gray-200 cursor-pointer'
                                    }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Month 2 */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-6" />
                            <div className="font-bold text-sm text-airbnb-black dark:text-white">
                              {calendarBaseMonth === 0 ? 'October 2026' : calendarBaseMonth === 1 ? 'November 2026' : calendarBaseMonth === 2 ? 'December 2026' : 'January 2027'}
                            </div>
                            <button
                              type="button"
                              onClick={() => setCalendarBaseMonth(Math.min(3, calendarBaseMonth + 1))}
                              disabled={calendarBaseMonth === 3}
                              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4 -rotate-90 text-airbnb-black dark:text-white" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 text-center text-xs font-semibold text-airbnb-grey dark:text-gray-400 mb-2">
                            <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          </div>
                          <div className="grid grid-cols-7 gap-y-1.5 text-center text-xs font-semibold">
                            {[...Array(calendarBaseMonth === 0 ? 4 : calendarBaseMonth === 1 ? 0 : calendarBaseMonth === 2 ? 2 : 5)].map((_, idx) => (
                              <div key={`empty-2-${idx}`} />
                            ))}
                            {[...Array(calendarBaseMonth === 0 ? 31 : calendarBaseMonth === 1 ? 30 : calendarBaseMonth === 2 ? 31 : 31)].map((_, i) => {
                              const day = i + 1;
                              const mNum = calendarBaseMonth + 10;
                              const yearStr = mNum > 12 ? '2027' : '2026';
                              const mForm = mNum > 12 ? mNum - 12 : mNum;
                              const dateStr = `${yearStr}-${mForm < 10 ? '0' + mForm : mForm}-${day < 10 ? '0' + day : day}`;
                              const todayISTStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                              const isPast = dateStr < todayISTStr;
                              const isCheckIn = checkIn === dateStr;
                              const isCheckOut = checkOut === dateStr;
                              const isSelected = isCheckIn || isCheckOut;
                              const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
                              return (
                                <button
                                  key={day}
                                  disabled={isPast}
                                  onClick={() => {
                                    if (isPast) return;
                                    if (!checkIn || (checkIn && checkOut)) { setCheckIn(dateStr); setCheckOut(''); }
                                    else if (dateStr > checkIn) { setCheckOut(dateStr); setActivePopover('who'); }
                                    else { setCheckIn(dateStr); }
                                  }}
                                  className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center transition-all ${isPast
                                    ? 'opacity-25 line-through cursor-not-allowed text-gray-400 dark:text-gray-600'
                                    : isSelected
                                      ? 'bg-[#222222] dark:bg-white text-white dark:text-black font-bold scale-105 shadow-xs cursor-pointer'
                                      : isInRange
                                        ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded-none w-full cursor-pointer'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-airbnb-black dark:text-gray-200 cursor-pointer'
                                    }`}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* Bottom Day Flexibility Pills */}
                      <div className="w-full border-t border-airbnb-border dark:border-gray-800 mt-6 pt-4 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                          {[
                            { label: 'Exact dates', value: 'exact' },
                            { label: '± 1 day', value: '1day' },
                            { label: '± 2 days', value: '2days' },
                            { label: '± 3 days', value: '3days' },
                            { label: '± 7 days', value: '7days' },
                            { label: '± 14 days', value: '14days' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setDateFlexibility(opt.value)}
                              className={`px-4 py-2 rounded-full border transition-all cursor-pointer text-xs font-semibold flex-shrink-0 ${dateFlexibility === opt.value
                                ? 'border-2 border-black dark:border-white font-bold bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white shadow-xs'
                                : 'border-airbnb-border dark:border-gray-700 hover:border-black text-airbnb-black dark:text-gray-300'
                                }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Flexible Section matching User Screenshot */
                    <div className="w-full flex flex-col items-center gap-8 py-2 px-2">
                      {/* How long would you like to stay? */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="text-lg font-extrabold text-airbnb-black dark:text-white">
                          How long would you like to stay?
                        </div>
                        <div className="flex items-center gap-3">
                          {(['weekend', 'week', 'month'] as const).map((dur) => (
                            <button
                              key={dur}
                              onClick={() => setFlexibleDuration(flexibleDuration === dur ? null : dur)}
                              className={`px-6 py-2.5 rounded-full border text-xs font-semibold capitalize transition-all cursor-pointer ${flexibleDuration === dur
                                ? 'border-2 border-black dark:border-white text-black dark:text-white font-bold bg-white dark:bg-[#1A1A1A] shadow-xs'
                                : 'border-gray-200 dark:border-gray-700 text-airbnb-grey dark:text-gray-400 hover:border-black dark:hover:border-white'
                                }`}
                            >
                              {dur}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* When do you want to go? */}
                      <div className="flex flex-col items-center gap-4 w-full">
                        <div className="text-lg font-extrabold text-airbnb-black dark:text-white">
                          When do you want to go?
                        </div>

                        {/* Horizontal Month Cards Carousel */}
                        <div className="relative w-full flex items-center group/carousel">
                          {/* Scroll Left Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (monthScrollRef.current) {
                                monthScrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
                              }
                            }}
                            className="absolute -left-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center text-airbnb-black dark:text-white hover:scale-110 transition-all cursor-pointer opacity-90 hover:opacity-100"
                            aria-label="Scroll left"
                          >
                            <ChevronDown className="w-4 h-4 rotate-90" />
                          </button>

                          <div
                            ref={monthScrollRef}
                            onWheel={(e) => {
                              if (monthScrollRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                                monthScrollRef.current.scrollLeft += e.deltaY;
                              }
                            }}
                            className="flex items-center gap-4 overflow-x-auto no-scrollbar py-3 px-6 w-full scroll-smooth"
                          >
                            {[
                              { month: 'September', year: '2026' },
                              { month: 'October', year: '2026' },
                              { month: 'November', year: '2026' },
                              { month: 'December', year: '2026' },
                              { month: 'January', year: '2027' },
                              { month: 'February', year: '2027' },
                              { month: 'March', year: '2027' },
                              { month: 'April', year: '2027' },
                              { month: 'May', year: '2027' },
                              { month: 'June', year: '2027' },
                            ].map((m) => {
                              const label = `${m.month} ${m.year}`;
                              const isSelected = flexibleMonth === label;

                              return (
                                <button
                                  key={label}
                                  onClick={() => setFlexibleMonth(flexibleMonth === label ? null : label)}
                                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border min-w-[120px] w-[120px] h-[125px] flex-shrink-0 transition-all cursor-pointer ${isSelected
                                    ? 'border-2 border-black dark:border-white bg-[#F7F7F7] dark:bg-[#262626] shadow-md font-bold scale-105'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white'
                                    }`}
                                >
                                  <div className="mb-2">
                                    <svg className="w-8 h-8 text-airbnb-black dark:text-white stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                  </div>
                                  <span className="text-xs font-bold text-airbnb-black dark:text-white">{m.month}</span>
                                  <span className="text-[10px] text-airbnb-grey dark:text-gray-400 mt-0.5">{m.year}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Scroll Right Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (monthScrollRef.current) {
                                monthScrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
                              }
                            }}
                            className="absolute -right-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700 shadow-md flex items-center justify-center text-airbnb-black dark:text-white hover:scale-110 transition-all cursor-pointer opacity-90 hover:opacity-100"
                            aria-label="Scroll right"
                          >
                            <ChevronDown className="w-4 h-4 -rotate-90" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setActivePopover('who')}
                    className="bg-[#222222] dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full font-bold cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0 mt-6"
                  >
                    Next: Who
                  </button>
                </div>
              )}

              {/* WHO CONTENT */}
              {activePopover === 'who' && (
                <div className="animate-popover-right">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-airbnb-border dark:border-gray-800 pb-4">
                      <div>
                        <div className="font-bold text-sm text-airbnb-black dark:text-white">Adults</div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400">Ages 13 or above</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          disabled={adults <= 1}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-airbnb-black dark:text-white w-4 text-center">{adults}</span>
                        <button
                          onClick={() => setAdults(adults + 1)}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-airbnb-border dark:border-gray-800 pb-4">
                      <div>
                        <div className="font-bold text-sm text-airbnb-black dark:text-white">Children</div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400">Ages 2–12</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          disabled={childrenCount <= 0}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-airbnb-black dark:text-white w-4 text-center">{childrenCount}</span>
                        <button
                          onClick={() => setChildrenCount(childrenCount + 1)}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <div className="font-bold text-sm text-airbnb-black dark:text-white">Infants</div>
                        <div className="text-xs text-airbnb-grey dark:text-gray-400">Under 2</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setInfantsCount(Math.max(0, infantsCount - 1))}
                          disabled={infantsCount <= 0}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center disabled:opacity-30 cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm text-airbnb-black dark:text-white w-4 text-center">{infantsCount}</span>
                        <button
                          onClick={() => setInfantsCount(infantsCount + 1)}
                          className="w-8 h-8 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center cursor-pointer text-airbnb-black dark:text-white hover:border-black dark:hover:border-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleClearAllSearch}
                        className="flex-1 py-3 rounded-2xl border border-airbnb-border dark:border-gray-700 font-bold text-sm text-airbnb-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        Clear all
                      </button>
                      <button
                        onClick={() => {
                          setIsExpandedSearchOpen(false);
                          setActivePopover(null);
                          const queryParams = new URLSearchParams();
                          if (selectedLocation) queryParams.set('location', selectedLocation);
                          if (totalGuests > 1) queryParams.set('guests', totalGuests.toString());
                          if (checkIn) queryParams.set('check_in', checkIn);
                          if (checkOut) queryParams.set('check_out', checkOut);
                          const searchStr = queryParams.toString();
                          router.push(`/${searchStr ? '?' + searchStr : ''}`);
                        }}
                        className="flex-1 bg-airbnb-black dark:bg-white text-white dark:text-black py-3 rounded-2xl font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                      >
                        Apply & Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </header>
  );
};