'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, MapPin, X, Plus, Minus } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (params: {
    location?: string;
    check_in?: string;
    check_out?: string;
    guests?: number;
  }) => void;
  initialLocation?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialLocation = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 1,
}) => {
  const [activeTab, setActiveTab] = useState<'where' | 'dates' | 'who'>('where');
  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);

  useEffect(() => {
    if (isOpen) {
      setLocation(initialLocation);
      setCheckIn(initialCheckIn);
      setCheckOut(initialCheckOut);
      setGuests(initialGuests);
      setActiveTab('where');
    }
  }, [isOpen, initialLocation, initialCheckIn, initialCheckOut, initialGuests]);

  const popularLocations = [
    { name: 'Gurgaon District, Haryana', region: 'Near you' },
    { name: 'New Delhi, Delhi', region: 'For sights like India Gate' },
    { name: 'North Goa, Goa', region: 'Popular beach destination' },
    { name: 'Varanasi, Uttar Pradesh', region: 'A hidden gem' },
    { name: 'Candolim, Goa', region: 'Beach Paradise' },
    { name: 'Jaipur, Rajasthan', region: 'Heritage & Royalty' },
  ];

  const handleClear = () => {
    setLocation('');
    setCheckIn('');
    setCheckOut('');
    setGuests(1);
    setActiveTab('where');
  };

  const handleApplySearch = () => {
    onSearch({
      location: location.trim() ? location : undefined,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      guests,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#1F1F1F] rounded-3xl shadow-2xl overflow-hidden z-10 border border-airbnb-border dark:border-gray-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-airbnb-border dark:border-gray-800">
            <h2 className="text-lg font-bold text-airbnb-black dark:text-white">Search Places</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-airbnb-lightGrey dark:hover:bg-gray-800 transition-colors cursor-pointer text-airbnb-black dark:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar Tabs */}
          <div className="p-6 bg-gray-50 dark:bg-[#262626] border-b border-airbnb-border dark:border-gray-800">
            <div className="grid grid-cols-3 gap-2 bg-gray-200/70 dark:bg-gray-800 p-1.5 rounded-full">
              {/* Where Tab */}
              <button
                onClick={() => setActiveTab('where')}
                className={`flex flex-col text-left px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'where'
                    ? 'bg-white dark:bg-[#1A1A1A] shadow-md scale-[1.02]'
                    : 'hover:bg-white/50 dark:hover:bg-white/5 opacity-80'
                }`}
              >
                <span className="text-[11px] font-bold tracking-wider text-airbnb-black dark:text-gray-100 uppercase">Where</span>
                <span className="text-sm truncate font-medium text-airbnb-black dark:text-gray-200">
                  {location || 'Search destinations'}
                </span>
              </button>

              {/* When Tab */}
              <button
                onClick={() => setActiveTab('dates')}
                className={`flex flex-col text-left px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'dates'
                    ? 'bg-white dark:bg-[#1A1A1A] shadow-md scale-[1.02]'
                    : 'hover:bg-white/50 dark:hover:bg-white/5 opacity-80'
                }`}
              >
                <span className="text-[11px] font-bold tracking-wider text-airbnb-black dark:text-gray-100 uppercase">When</span>
                <span className="text-sm truncate font-medium text-airbnb-black dark:text-gray-200">
                  {checkIn && checkOut ? `${checkIn} → ${checkOut}` : 'Add dates'}
                </span>
              </button>

              {/* Who Tab */}
              <button
                onClick={() => setActiveTab('who')}
                className={`flex flex-col text-left px-5 py-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === 'who'
                    ? 'bg-white dark:bg-[#1A1A1A] shadow-md scale-[1.02]'
                    : 'hover:bg-white/50 dark:hover:bg-white/5 opacity-80'
                }`}
              >
                <span className="text-[11px] font-bold tracking-wider text-airbnb-black dark:text-gray-100 uppercase">Who</span>
                <span className="text-sm truncate font-medium text-airbnb-black dark:text-gray-200">
                  {guests > 0 ? `${guests} ${guests === 1 ? 'guest' : 'guests'}` : 'Add guests'}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="p-8 max-h-[420px] overflow-y-auto">
            {activeTab === 'where' && (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-airbnb-grey dark:text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplySearch();
                    }}
                    placeholder="Search destinations (e.g. Gurgaon, Delhi, Goa, Varanasi)"
                    className="w-full pl-12 pr-4 py-3.5 border border-airbnb-border dark:border-gray-700 rounded-2xl focus:outline-none focus:border-airbnb-black dark:focus:border-white text-sm font-medium bg-white dark:bg-[#262626] text-airbnb-black dark:text-white"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-3">
                    Suggested Destinations
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {popularLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => setLocation(loc.name)}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-airbnb-border dark:border-gray-700 hover:border-airbnb-black dark:hover:border-white hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] transition-all duration-200 text-left cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-gray-800 text-airbnb-red flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                          📍
                        </div>
                        <div>
                          <div className="text-sm font-bold text-airbnb-black dark:text-white">{loc.name}</div>
                          <div className="text-xs text-airbnb-grey dark:text-gray-400">{loc.region}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dates' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-2">Check-in Date</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full p-3.5 border border-airbnb-border dark:border-gray-700 rounded-xl focus:outline-none focus:border-airbnb-black dark:focus:border-white text-sm bg-white dark:bg-[#262626] text-airbnb-black dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-airbnb-grey dark:text-gray-400 mb-2">Check-out Date</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full p-3.5 border border-airbnb-border dark:border-gray-700 rounded-xl focus:outline-none focus:border-airbnb-black dark:focus:border-white text-sm bg-white dark:bg-[#262626] text-airbnb-black dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'who' && (
              <div className="flex items-center justify-between p-4 border border-airbnb-border dark:border-gray-700 rounded-2xl bg-white dark:bg-[#262626]">
                <div>
                  <div className="font-bold text-airbnb-black dark:text-white text-base">Guests</div>
                  <div className="text-airbnb-grey dark:text-gray-400 text-xs">Ages 13 or above</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="w-9 h-9 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center text-airbnb-black dark:text-white disabled:opacity-40 hover:border-airbnb-black dark:hover:border-white transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-airbnb-black dark:text-white w-6 text-center">{guests}</span>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="w-9 h-9 rounded-full border border-airbnb-border dark:border-gray-700 flex items-center justify-center text-airbnb-black dark:text-white hover:border-airbnb-black dark:hover:border-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-airbnb-border dark:border-gray-800 bg-white dark:bg-[#1F1F1F]">
            <button
              onClick={handleClear}
              className="text-sm font-semibold text-airbnb-black dark:text-white underline hover:opacity-80 cursor-pointer"
            >
              Clear all
            </button>
            <button
              onClick={handleApplySearch}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-semibold text-sm rounded-xl shadow-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
