'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Grid,
  List,
  X,
  Check,
  Edit2,
  ArrowLeft,
  Plus,
  Minus,
  HelpCircle,
  Calendar as CalendarIcon,
  RotateCcw
} from 'lucide-react';
import { apiGetHostSettings, apiUpdateHostSettings } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface DateConfig {
  day: number;
  price: number;
  isAvailable: boolean;
  isToday?: boolean;
}

type SubViewMode =
  | 'none'
  | 'pricing_menu'
  | 'pricing_per_night'
  | 'pricing_weekend'
  | 'discounts_menu'
  | 'availability_menu'
  | 'cancellations_menu';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  rate: number; // multiplier from INR
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 0.018 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 0.016 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 0.044 }
];

export function HostCalendar() {
  const { showToast } = useToast();

  // Dynamic Date/Time state using Indian Standard Time (Asia/Kolkata)
  const getISTParts = () => {
    const istStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const [y, m, d] = istStr.split('-').map(Number);
    return { year: y, monthIndex: m - 1, day: d };
  };

  const istNow = getISTParts();
  const [currentMonthIndex, setCurrentMonthIndex] = useState(istNow.monthIndex);
  const [currentYear, setCurrentYear] = useState(istNow.year);
  const [viewMode, setViewMode] = useState<'Month' | 'Year' | 'Week'>('Month');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Currency Selection State
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(CURRENCIES[0]);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);

  // Popover toggles
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceVal, setEditPriceVal] = useState('1511');

  // Active Sub-view Mode for the Settings Panel
  const [subView, setSubView] = useState<SubViewMode>('none');

  // Host DB Settings State
  const [settings, setSettings] = useState({
    listing_id: null as number | null,
    price_per_night: 1511,
    weekend_price_percent: 10,
    weekly_discount_percent: 10,
    monthly_discount_percent: 20,
    min_nights: 1,
    max_nights: 365,
    cancellation_policy_short: 'Flexible',
    cancellation_policy_long: 'Firm Long-Term'
  });

  const [tempPrice, setTempPrice] = useState(1511);
  const [tempWeekendPercent, setTempWeekendPercent] = useState(10);
  const [tempWeeklyDiscount, setTempWeeklyDiscount] = useState(10);
  const [tempMonthlyDiscount, setTempMonthlyDiscount] = useState(20);
  const [tempMinNights, setTempMinNights] = useState(1);
  const [tempMaxNights, setTempMaxNights] = useState(365);
  const [tempCancelShort, setTempCancelShort] = useState('Flexible');
  const [tempCancelLong, setTempCancelLong] = useState('Firm Long-Term');
  const [isLoading, setIsLoading] = useState(true);

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in selected month & starting day offset
  const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonthIndex, 1).getDay();

  // Fetch settings from DB on load
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const res = await apiGetHostSettings();
        if (res) {
          setSettings(res);
          setTempPrice(res.price_per_night || 1511);
          setTempWeekendPercent(res.weekend_price_percent ?? 10);
          setTempWeeklyDiscount(res.weekly_discount_percent ?? 10);
          setTempMonthlyDiscount(res.monthly_discount_percent ?? 20);
          setTempMinNights(res.min_nights ?? 1);
          setTempMaxNights(res.max_nights ?? 365);
          setTempCancelShort(res.cancellation_policy_short || 'Flexible');
          setTempCancelLong(res.cancellation_policy_long || 'Firm Long-Term');
        }
      } catch (err: any) {
        showToast('Failed to load host settings from server', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Dynamic calendar dates state keying by "year-month-day"
  const [datesState, setDatesState] = useState<Record<string, DateConfig>>({});

  // Helper to build date key
  const getDateKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

  // Get or compute date config
  const getDateConfig = (day: number): DateConfig => {
    const key = getDateKey(currentYear, currentMonthIndex, day);
    if (datesState[key]) return datesState[key];

    const dayOfWeek = new Date(currentYear, currentMonthIndex, day).getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const wP = Math.round(settings.price_per_night * (1 + settings.weekend_price_percent / 100));

    const todayIST = getISTParts();
    const isToday = currentYear === todayIST.year && currentMonthIndex === todayIST.monthIndex && day === todayIST.day;

    return {
      day,
      price: isWeekend ? wP : settings.price_per_night,
      isAvailable: true,
      isToday
    };
  };

  const updateDateConfig = (day: number, update: Partial<DateConfig>) => {
    const key = getDateKey(currentYear, currentMonthIndex, day);
    const cur = getDateConfig(day);
    setDatesState((prev) => ({
      ...prev,
      [key]: {
        ...cur,
        ...update
      }
    }));
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const currentDateObj = selectedDate ? getDateConfig(selectedDate) : null;

  const handleToggleAvailable = (day: number) => {
    const cur = getDateConfig(day);
    updateDateConfig(day, { isAvailable: !cur.isAvailable });
  };

  const handleSavePriceEdit = (day: number) => {
    const num = Number(editPriceVal) || settings.price_per_night;
    updateDateConfig(day, { price: num });
    setIsEditingPrice(false);
  };

  const saveSettingsToDb = async (updatePayload: Partial<typeof settings>) => {
    try {
      const updated = await apiUpdateHostSettings({
        listing_id: settings.listing_id,
        ...updatePayload
      });
      setSettings(updated);
      showToast('Settings saved to database!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings in database', 'error');
    }
  };

  const formatKPrice = (val: number) => {
    const converted = Math.round(val * selectedCurrency.rate);
    if (converted >= 1000) {
      return `${selectedCurrency.symbol}${(converted / 1000).toFixed(1).replace('.0', '')}K`;
    }
    return `${selectedCurrency.symbol}${converted}`;
  };

  const calculateFriSatPrice = (base: number, percent: number) => {
    return Math.round(base * (1 + percent / 100));
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {/* LEFT SECTION: Main Calendar Grid */}
      <div className="flex-1 w-full bg-white dark:bg-[#1A1A1A] rounded-3xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-xs relative">
        {/* Calendar Header Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          {/* Month Title & Arrow Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsMonthDropdownOpen(!isMonthDropdownOpen);
                  setIsViewDropdownOpen(false);
                }}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-[#262626] px-3 py-1.5 rounded-2xl transition-colors cursor-pointer"
              >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                  {MONTH_NAMES[currentMonthIndex]} {currentYear}
                </h2>
                <ChevronDown className={`w-6 h-6 text-[#222222] dark:text-white stroke-[2.5] transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Month Selector Dropdown */}
              {isMonthDropdownOpen && (
                <div className="absolute left-0 top-14 z-50 w-64 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-2">
                    <button
                      type="button"
                      onClick={() => setCurrentYear((y) => y - 1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">{currentYear}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentYear((y) => y + 1)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto">
                    {MONTH_NAMES.map((mName, idx) => (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => {
                          setCurrentMonthIndex(idx);
                          setIsMonthDropdownOpen(false);
                          setSelectedDate(null);
                        }}
                        className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          idx === currentMonthIndex
                            ? 'bg-black dark:bg-white text-white dark:text-black'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {mName.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prev/Next Navigation Arrows */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#262626] p-1 rounded-full border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Filters: Month/Year/Week dropdown + Grid/List layout toggle */}
          <div className="flex items-center gap-3">
            {/* View Mode Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsViewDropdownOpen(!isViewDropdownOpen);
                  setIsMonthDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white font-semibold text-xs text-gray-800 dark:text-gray-200 transition-colors cursor-pointer bg-gray-50/80 dark:bg-[#262626]"
              >
                <span>{viewMode}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isViewDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isViewDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-40 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
                  {(['Month', 'Year', 'Week'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setViewMode(mode);
                        setIsViewDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                        viewMode === mode ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{mode} View</span>
                      {viewMode === mode && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Layout Mode Toggle (Grid vs List) */}
            <button
              type="button"
              onClick={() => setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid')}
              title={layoutMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
              className={`w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center transition-colors cursor-pointer text-gray-700 dark:text-gray-300 ${
                layoutMode === 'list' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {layoutMode === 'grid' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* VIEW 1: MONTH VIEW */}
        {viewMode === 'Month' && (
          <>
            {layoutMode === 'grid' ? (
              <>
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 text-center font-bold text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div className="text-amber-700 dark:text-amber-400">Fri</div>
                  <div>Sat</div>
                </div>

                {/* 7-Column Calendar Grid */}
                <div className="grid grid-cols-7 gap-2.5">
                  {/* Empty cells for month offset */}
                  {Array.from({ length: startDayOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-[4/3] hidden sm:block" />
                  ))}

                  {/* Day cards */}
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((dayNum) => {
                    const dateInfo = getDateConfig(dayNum);
                    const isSelected = selectedDate === dayNum;
                    const isToday = dateInfo.isToday;
                    const isAvailable = dateInfo.isAvailable;

                    return (
                      <div
                        key={dayNum}
                        onClick={() => {
                          setSelectedDate(dayNum);
                          setEditPriceVal(String(dateInfo.price));
                          setIsEditingPrice(false);
                          setSubView('none');
                        }}
                        className={`group aspect-[4/3] rounded-2xl p-2 sm:p-3 flex flex-col justify-between transition-all cursor-pointer select-none border relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#222222] dark:bg-white text-white dark:text-black border-black dark:border-white ring-2 ring-black dark:ring-white shadow-md z-10'
                            : !isAvailable
                            ? 'bg-[#222222] dark:bg-[#121212] text-gray-300 dark:text-gray-500 border-gray-800'
                            : 'bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-200/80 dark:border-gray-700/80 hover:border-gray-400'
                        }`}
                      >
                        {/* Date Number Top Left */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              isToday
                                ? 'w-6 h-6 rounded-full bg-[#E81948] text-white flex items-center justify-center'
                                : isSelected
                                ? 'text-white dark:text-black'
                                : !isAvailable
                                ? 'line-through text-gray-400 dark:text-gray-600 font-semibold'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {dayNum}
                          </span>
                        </div>

                        {/* Price Tag Bottom Left */}
                        <div className="text-left">
                          <span
                            className={`text-[11px] sm:text-xs font-bold tracking-tight ${
                              isSelected
                                ? 'text-gray-100 dark:text-gray-900'
                                : !isAvailable
                                ? 'text-gray-400 dark:text-gray-600 font-semibold'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {formatKPrice(dateInfo.price)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* LIST/AGENDA VIEW FOR MONTH */
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((dayNum) => {
                  const dateInfo = getDateConfig(dayNum);
                  const isSelected = selectedDate === dayNum;
                  const dayName = MONTH_NAMES[currentMonthIndex].slice(0, 3);

                  return (
                    <div
                      key={dayNum}
                      onClick={() => {
                        setSelectedDate(dayNum);
                        setEditPriceVal(String(dateInfo.price));
                        setIsEditingPrice(false);
                        setSubView('none');
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#222222] dark:bg-white text-white dark:text-black border-black dark:border-white ring-2 ring-black dark:ring-white shadow-md'
                          : 'bg-[#F7F7F7] dark:bg-[#262626] border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-400'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold opacity-60">{dayName}</span>
                        <p className="text-xl font-extrabold mt-1">{dayNum}</p>
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">₹{dateInfo.price}</span>
                        <span className={`text-[10px] font-bold ${dateInfo.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {dateInfo.isAvailable ? 'Available' : 'Blocked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* VIEW 2: YEAR VIEW */}
        {viewMode === 'Year' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[560px] overflow-y-auto p-1">
            {MONTH_NAMES.map((mName, mIdx) => (
              <div
                key={mName}
                onClick={() => {
                  setCurrentMonthIndex(mIdx);
                  setViewMode('Month');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  mIdx === currentMonthIndex
                    ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
                    : 'bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-sm">{mName}</h4>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-xs font-semibold opacity-75">
                  {new Date(currentYear, mIdx + 1, 0).getDate()} Days
                </p>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 3: WEEK VIEW */}
        {viewMode === 'Week' && (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
                const dateInfo = getDateConfig(dayNum);
                const isSelected = selectedDate === dayNum;
                const dayName = new Date(currentYear, currentMonthIndex, dayNum).toLocaleDateString('en-US', { weekday: 'short' });

                return (
                  <div
                    key={dayNum}
                    onClick={() => {
                      setSelectedDate(dayNum);
                      setEditPriceVal(String(dateInfo.price));
                      setIsEditingPrice(false);
                      setSubView('none');
                    }}
                    className={`p-4 rounded-2xl border flex flex-col justify-between h-40 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
                        : 'bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold opacity-60">{dayName}</span>
                      <p className="text-xl font-extrabold mt-1">{dayNum}</p>
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">₹{dateInfo.price}</span>
                      <span className={`text-[10px] font-bold ${dateInfo.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {dateInfo.isAvailable ? 'Available' : 'Blocked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Controls at Bottom Right */}
        <div className="flex justify-end gap-3 mt-6 relative">
          {/* Interactive Currency Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="px-4 py-2 rounded-full bg-white dark:bg-[#262626] border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg hover:border-black dark:hover:border-white font-bold text-xs text-gray-800 dark:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{selectedCurrency.code} ({selectedCurrency.symbol})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-600 dark:text-gray-300 transition-transform ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Currency Selector Popover */}
            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 bottom-12 z-50 w-56 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Select Currency
                </div>
                <div className="space-y-0.5 max-h-52 overflow-y-auto">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(curr);
                        setIsCurrencyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                        selectedCurrency.code === curr.code
                          ? 'bg-black dark:bg-white text-white dark:text-black'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <span>{curr.name}</span>
                      <span className="font-mono text-xs">{curr.code} ({curr.symbol})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Interactive Sidebar Panel */}
      <div className="w-full lg:w-[380px] flex-shrink-0 transition-all duration-300">
        {selectedDate !== null && currentDateObj ? (
          /* SELECTED DATE SIDEBAR PANEL */
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Header: Date Badge & Close Button */}
            <div className="flex items-center justify-end gap-3 mb-2">
              <span className="px-5 py-2 rounded-full bg-[#222222] dark:bg-white text-white dark:text-black font-extrabold text-sm shadow-xs">
                {selectedDate} {MONTH_NAMES[currentMonthIndex].slice(0, 3)}
              </span>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full bg-[#222222] dark:bg-white text-white dark:text-black flex items-center justify-center hover:bg-black dark:hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CARD 1: Available / Blocked Toggle */}
            <div className="bg-[#121212] dark:bg-[#1A1A1A] text-white rounded-3xl p-5 shadow-lg border border-gray-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">
                    {currentDateObj.isAvailable ? 'Available' : 'Blocked by you'}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      currentDateObj.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                </div>
                {!currentDateObj.isAvailable && (
                  <button className="text-xs text-gray-400 underline font-medium mt-0.5 hover:text-white cursor-pointer">
                    Add a note
                  </button>
                )}
              </div>

              {/* Pill Toggle Button */}
              <div
                onClick={() => handleToggleAvailable(selectedDate)}
                className="w-16 h-9 rounded-full bg-[#2A2A2A] border border-gray-700 p-1 flex items-center cursor-pointer relative transition-colors"
              >
                <div
                  className={`w-7 h-7 rounded-full bg-white text-black flex items-center justify-center transition-transform duration-200 shadow-md ${
                    currentDateObj.isAvailable ? 'translate-x-7' : 'translate-x-0'
                  }`}
                >
                  {currentDateObj.isAvailable ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <X className="w-4 h-4 stroke-[3]" />
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2: Editable Price Card */}
            <div className="bg-[#121212] dark:bg-[#1A1A1A] text-white rounded-3xl p-6 shadow-lg border border-gray-800 relative">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Nightly price
              </div>

              {isEditingPrice ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Custom date price</span>
                    <button
                      onClick={() => handleSavePriceEdit(selectedDate)}
                      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-4xl font-extrabold text-white">₹</span>
                    <input
                      type="number"
                      autoFocus
                      value={editPriceVal}
                      onChange={(e) => setEditPriceVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePriceEdit(selectedDate);
                      }}
                      className="w-full text-4xl font-extrabold text-white bg-transparent outline-none border-b border-rose-500 pb-1"
                    />
                  </div>

                  <div className="text-xs text-gray-400 font-medium">
                    You earn ₹{Math.round((Number(editPriceVal) || 1511) * 0.85).toLocaleString('en-IN')}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹{currentDateObj.price.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setIsEditingPrice(true)}
                        className="w-8 h-8 rounded-full bg-[#2A2A2A] hover:bg-gray-700 flex items-center justify-center text-white transition-colors cursor-pointer"
                        title="Edit price"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 font-medium mt-2">
                    You earn ₹{Math.round(currentDateObj.price * 0.85).toLocaleString('en-IN')}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* GENERAL HOST SETTINGS PANEL MATCHING USER SCREENSHOTS */
          <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xs relative overflow-hidden">
            {/* SUB-VIEW 1: Pricing Main Screen */}
            {subView === 'pricing_menu' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                    Pricing
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    These apply to all nights, unless you customise them by date.
                  </p>
                </div>

                {/* Option 1: Per night */}
                <div
                  onClick={() => {
                    setTempPrice(settings.price_per_night);
                    setSubView('pricing_per_night');
                  }}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#262626] flex items-center justify-between cursor-pointer transition-all shadow-xs"
                >
                  <span className="font-bold text-sm text-[#222222] dark:text-white">Per night</span>
                  <span className="font-extrabold text-lg text-[#222222] dark:text-white">
                    ₹{settings.price_per_night.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Option 2: Weekend adjustment */}
                <div
                  onClick={() => {
                    setTempWeekendPercent(settings.weekend_price_percent);
                    setSubView('pricing_weekend');
                  }}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#262626] flex items-center justify-between cursor-pointer transition-all shadow-xs"
                >
                  <span className="font-bold text-sm text-[#222222] dark:text-white">Weekend adjustment</span>
                  <span className="font-extrabold text-lg text-[#222222] dark:text-white">
                    +{settings.weekend_price_percent}%
                  </span>
                </div>
              </div>
            )}

            {/* SUB-VIEW 1A: Per night edit screen */}
            {subView === 'pricing_per_night' && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setSubView('pricing_menu')}
                    className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="font-extrabold text-sm text-[#222222] dark:text-white">Per night</span>
                  <div className="w-9" />
                </div>

                {/* Giant editable price */}
                <div className="my-8">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl font-extrabold text-[#222222] dark:text-white">₹</span>
                    <input
                      type="number"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(Number(e.target.value) || 0)}
                      className="w-48 text-5xl font-extrabold text-[#222222] dark:text-white text-center bg-transparent border-b-2 border-black dark:border-white outline-none pb-1"
                    />
                  </div>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-3">
                    You earn ₹{Math.round(tempPrice * 0.85).toLocaleString('en-IN')}{' '}
                    <span className="text-gray-400">∨</span>
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 font-bold text-xs text-gray-800 dark:text-gray-200 shadow-xs hover:border-black dark:hover:border-white transition-all cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Show similar listings</span>
                  </button>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettingsToDb({ price_per_night: tempPrice });
                      setSubView('pricing_menu');
                    }}
                    className="w-full py-3.5 bg-airbnb-black hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView('pricing_menu')}
                    className="w-full py-3 bg-white dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 1B: Weekend adjustment edit screen */}
            {subView === 'pricing_weekend' && (
              <div className="space-y-6 animate-in fade-in duration-200 text-center py-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setSubView('pricing_menu')}
                    className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="font-extrabold text-sm text-[#222222] dark:text-white">Weekend adjustment</span>
                  <div className="w-9" />
                </div>

                {/* Giant percentage display */}
                <div className="my-6">
                  <div className="text-5xl font-extrabold text-[#222222] dark:text-white tracking-tight flex items-center justify-center gap-1">
                    <span>+{tempWeekendPercent}%</span>
                    <Edit2 className="w-5 h-5 text-gray-400 stroke-[2]" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
                    ₹{calculateFriSatPrice(settings.price_per_night, tempWeekendPercent).toLocaleString('en-IN')} for Fri and Sat
                  </p>
                </div>

                {/* Interactive percentage slider */}
                <div className="px-4 py-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={tempWeekendPercent}
                    onChange={(e) => setTempWeekendPercent(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="underline text-xs font-bold text-gray-800 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    Show similar listings
                  </button>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettingsToDb({ weekend_price_percent: tempWeekendPercent });
                      setSubView('pricing_menu');
                    }}
                    className="w-full py-3.5 bg-airbnb-black hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubView('pricing_menu')}
                    className="w-full py-3 bg-white dark:bg-[#262626] hover:bg-gray-100 dark:hover:bg-[#333] text-gray-800 dark:text-white border border-gray-300 dark:border-gray-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: Discounts Screen */}
            {subView === 'discounts_menu' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                    Discounts
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    These apply to all nights, unless you customise them by date.
                  </p>
                </div>

                {/* Card 1: Weekly */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#222222] dark:text-white">Weekly</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">For 7 nights or more</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={tempWeeklyDiscount}
                        onChange={(e) => setTempWeeklyDiscount(Number(e.target.value))}
                        className="w-16 text-right font-extrabold text-2xl text-[#222222] dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none focus:border-black dark:focus:border-white"
                      />
                      <span className="font-extrabold text-2xl text-[#222222] dark:text-white">%</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Weekly average is ₹
                    {Math.round(
                      settings.price_per_night * 7 * (1 - tempWeeklyDiscount / 100)
                    ).toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Card 2: Monthly */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#222222] dark:text-white">Monthly</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">For 28 nights or more</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={tempMonthlyDiscount}
                        onChange={(e) => setTempMonthlyDiscount(Number(e.target.value))}
                        className="w-16 text-right font-extrabold text-2xl text-[#222222] dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none focus:border-black dark:focus:border-white"
                      />
                      <span className="font-extrabold text-2xl text-[#222222] dark:text-white">%</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    Monthly average is ₹
                    {Math.round(
                      settings.price_per_night * 28 * (1 - tempMonthlyDiscount / 100)
                    ).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettingsToDb({
                        weekly_discount_percent: tempWeeklyDiscount,
                        monthly_discount_percent: tempMonthlyDiscount
                      });
                      setSubView('none');
                    }}
                    className="w-full py-3.5 bg-airbnb-black hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Save discounts
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: Availability Screen */}
            {subView === 'availability_menu' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                    Availability
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    These apply to all nights, unless you customise them by date.
                  </p>
                </div>

                {/* Card 1: Minimum nights */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-white">Minimum nights</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTempMinNights(Math.max(1, tempMinNights - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:border-black dark:hover:border-white cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-extrabold text-lg text-[#222222] dark:text-white">{tempMinNights}</span>
                    <button
                      type="button"
                      onClick={() => setTempMinNights(tempMinNights + 1)}
                      className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:border-black dark:hover:border-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card 2: Maximum nights */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] flex items-center justify-between shadow-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-white">Maximum nights</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={tempMaxNights}
                      onChange={(e) => setTempMaxNights(Number(e.target.value) || 365)}
                      className="w-20 text-right font-extrabold text-2xl text-[#222222] dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 outline-none focus:border-black dark:focus:border-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettingsToDb({
                        min_nights: tempMinNights,
                        max_nights: tempMaxNights
                      });
                      setSubView('none');
                    }}
                    className="w-full py-3.5 bg-airbnb-black hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Save availability
                  </button>
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: Cancellations Screen */}
            {subView === 'cancellations_menu' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setSubView('none')}
                  className="w-9 h-9 rounded-full bg-[#F7F7F7] dark:bg-[#262626] hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div>
                  <h3 className="text-2xl font-extrabold text-[#222222] dark:text-white tracking-tight">
                    Cancellations
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    These apply to all nights, unless you customise them by date.
                  </p>
                </div>

                {/* Card 1: Short-term stays */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] space-y-3 shadow-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-white">Short-term stays</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For less than 28 nights</p>
                  </div>
                  <select
                    value={tempCancelShort}
                    onChange={(e) => setTempCancelShort(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 font-extrabold text-base text-[#222222] dark:text-white bg-white dark:bg-[#1A1A1A] outline-none focus:border-black dark:focus:border-white cursor-pointer"
                  >
                    <option value="Flexible">Flexible</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Firm">Firm</option>
                    <option value="Strict">Strict</option>
                  </select>
                </div>

                {/* Card 2: Long-term stays */}
                <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#262626] space-y-3 shadow-xs">
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-white">Long-term stays</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">For 28 nights or more</p>
                  </div>
                  <select
                    value={tempCancelLong}
                    onChange={(e) => setTempCancelLong(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 font-extrabold text-base text-[#222222] dark:text-white bg-white dark:bg-[#1A1A1A] outline-none focus:border-black dark:focus:border-white cursor-pointer"
                  >
                    <option value="Firm Long-Term">Firm Long-Term</option>
                    <option value="Strict Long-Term">Strict Long-Term</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveSettingsToDb({
                        cancellation_policy_short: tempCancelShort,
                        cancellation_policy_long: tempCancelLong
                      });
                      setSubView('none');
                    }}
                    className="w-full py-3.5 bg-airbnb-black hover:bg-black text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Save policy
                  </button>
                </div>
              </div>
            )}

            {/* DEFAULT VIEW: List of 4 settings categories */}
            {subView === 'none' && (
              <div className="space-y-6">
                {/* Pricing Section */}
                <div
                  onClick={() => setSubView('pricing_menu')}
                  className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 group cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">Pricing</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      ₹{settings.price_per_night.toLocaleString('en-IN')} – ₹
                      {calculateFriSatPrice(
                        settings.price_per_night,
                        settings.weekend_price_percent
                      ).toLocaleString('en-IN')}{' '}
                      per night
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>

                {/* Discounts Section */}
                <div
                  onClick={() => {
                    setTempWeeklyDiscount(settings.weekly_discount_percent);
                    setTempMonthlyDiscount(settings.monthly_discount_percent);
                    setSubView('discounts_menu');
                  }}
                  className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 group cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">Discounts</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {settings.weekly_discount_percent}% weekly discount
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {settings.monthly_discount_percent}% monthly discount
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>

                {/* Availability Section */}
                <div
                  onClick={() => {
                    setTempMinNights(settings.min_nights);
                    setTempMaxNights(settings.max_nights);
                    setSubView('availability_menu');
                  }}
                  className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 group cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">Availability</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {settings.min_nights}–{settings.max_nights} night stays
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Same-day advance notice</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>

                {/* Cancellations Section */}
                <div
                  onClick={() => {
                    setTempCancelShort(settings.cancellation_policy_short);
                    setTempCancelLong(settings.cancellation_policy_long);
                    setSubView('cancellations_menu');
                  }}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">Cancellations</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                      {settings.cancellation_policy_short} for short-term stays
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {settings.cancellation_policy_long} for long-term stays
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
