'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Navigation, X, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { apiSaveHostDraft } from '@/lib/api';

export default function BecomeAHostAddressPage() {
  const router = useRouter();
  const { currentUser, isLoggedIn, setShowLoginModal } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      showToast('Please log in or sign up to become a host', 'info');
      router.push('/');
    }
  }, [isLoggedIn]);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isFinalPromptOpen, setIsFinalPromptOpen] = useState(false);
  const [isLoadingGeo, setIsLoadingGeo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Address Search Query & Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [country, setCountry] = useState('India - IN');
  const [flatHouse, setFlatHouse] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locality, setLocality] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      setIsAddressModalOpen(false);
      setIsConfirmModalOpen(true);
      return;
    }

    setIsLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setStreetAddress(addr.road || addr.suburb || addr.neighbourhood || '');
            setLocality(addr.suburb || addr.neighbourhood || addr.residential || '');
            setCity(addr.city || addr.town || addr.municipality || addr.county || 'Noida');
            setState(addr.state || 'Uttar Pradesh');
            setPincode(addr.postcode || '');
          } else {
            setCity('Noida');
            setState('Uttar Pradesh');
          }
          showToast('Location detected successfully', 'success');
        } catch (_) {
          setCity('Noida');
          setState('Uttar Pradesh');
        } finally {
          setIsLoadingGeo(false);
          setIsAddressModalOpen(false);
          setIsConfirmModalOpen(true);
        }
      },
      () => {
        setIsLoadingGeo(false);
        setCity('Noida');
        setState('Uttar Pradesh');
        setIsAddressModalOpen(false);
        setIsConfirmModalOpen(true);
      },
      { timeout: 8000 }
    );
  };

  const handleAddressSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setIsAddressModalOpen(false);
      setIsConfirmModalOpen(true);
      return;
    }

    setIsLoadingGeo(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const topResult = results[0];
        const displayParts = (topResult.display_name || '').split(', ');
        setStreetAddress(query);
        setLocality(displayParts[1] || displayParts[0] || query);
        setCity(displayParts[2] || displayParts[1] || 'Noida');
        setState(displayParts[displayParts.length - 2] || 'Uttar Pradesh');
      } else {
        setStreetAddress(query);
        setLocality(query);
        setCity('Noida');
        setState('Uttar Pradesh');
      }
    } catch (_) {
      setStreetAddress(query);
      setCity('Noida');
      setState('Uttar Pradesh');
    } finally {
      setIsLoadingGeo(false);
      setIsAddressModalOpen(false);
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmNext = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateDraftAndProceed();
  };

  const handleCreateDraftAndProceed = async () => {
    try {
      setIsSaving(true);
      const draftData = {
        flat_house_no: flatHouse,
        street_address: streetAddress,
        landmark,
        locality,
        city,
        state,
        pincode,
        country: 'India',
        location: `${city || 'Greater Noida'}, ${state || 'Uttar Pradesh'}`
      };

      const result = await apiSaveHostDraft(draftData, currentUser?.id);
      showToast('Address saved! Starting your listing setup.', 'success');
      
      const draftId = result?.id || 1;
      router.push(`/become-a-host/${draftId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save address', 'error');
      // Fallback navigation
      router.push('/become-a-host/1');
    } finally {
      setIsSaving(false);
    }
  };

  const fullFormattedAddress = [
    streetAddress,
    locality,
    city,
    state,
    pincode,
    'India'
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen lg:h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col font-sans relative overflow-x-hidden lg:overflow-hidden transition-colors duration-200">
      {/* Top Bar Logo */}
      <header className="py-4 px-6 md:px-12 flex items-center justify-between z-10 shrink-0">

        <Link href="/" aria-label="Airbnb Home">
          <svg className="w-8 h-8 text-airbnb-red fill-current transition-transform duration-300 hover:scale-105" viewBox="0 0 32 32">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.905 0-5.464-1.808-6.906-4.542l-.094-.185-.094.185c-1.442 2.734-4.001 4.542-6.906 4.542-4.209 0-7.5-3.798-7.5-7.806 0-1.07.25-2.02.971-3.711l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.235 0-2.235.656-3.263 2.508l-.427.822c-1.89 3.705-5.975 12.28-6.924 14.502l-.128.312c-.596 1.424-.758 2.115-.758 2.856 0 2.972 2.378 5.806 5.5 5.806 2.392 0 4.521-1.636 5.586-4.148l.414-.975.414.975c1.065 2.512 3.194 4.148 5.586 4.148 3.122 0 5.5-2.834 5.5-5.806 0-.741-.162-1.432-.758-2.856l-.128-.312c-.949-2.222-5.034-10.797-6.924-14.502l-.427-.822C18.235 3.656 17.235 3 16 3zm0 13c1.657 0 3 1.343 3 3 0 2.137-1.666 4.29-3 5.485-1.334-1.195-3-3.348-3-5.485 0-1.657 1.343-3 3-3zm0 2c-.552 0-1 .448-1 1 0 .977.893 2.36 1 2.871.107-.511 1-1.894 1-2.871 0-.552-.448-1-1-1z" />
          </svg>
        </Link>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2 md:py-4 h-full overflow-hidden">
        {/* Left Column: Heading & Address Trigger */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center pr-0 lg:pr-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-airbnb-black dark:text-white tracking-tight leading-[1.1] mb-4">
            Set up your Airbnb listing
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg font-normal leading-relaxed mb-6 max-w-lg">
            It's easy to create a great listing – let's start with your address.
          </p>

          {/* Trigger Button opening Address Modal */}
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(true)}
            className="w-full max-w-md flex items-center gap-3 px-6 py-3.5 rounded-full border border-gray-400 dark:border-gray-700 hover:border-black dark:hover:border-white shadow-xs hover:shadow-md transition-all duration-200 text-left group cursor-pointer bg-white dark:bg-[#1A1A1A] active:scale-[0.99]"
          >
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            <span className="text-gray-600 dark:text-gray-200 font-medium text-base">Enter your address</span>
          </button>
        </div>

        {/* Right Column: Hero Image with Rounded Corners */}
        <div className="lg:col-span-6 xl:col-span-7 w-full h-[320px] lg:h-[calc(100vh-140px)] max-h-[480px] relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-700">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80"
            alt="Airbnb villa pool"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      </main>

      {/* Modal 1: Enter your address */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1A1A1A] border border-transparent dark:border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between relative">
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <h2 className="text-lg font-bold text-center flex-1 pr-8 text-airbnb-black dark:text-white">Enter your address</h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <form onSubmit={handleAddressSearchSubmit} className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter your address"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#262626] text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black outline-none text-base transition-all"
                />
              </form>

              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLoadingGeo}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262626] hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-[#333333] active:scale-[0.99] transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black flex items-center justify-center transition-colors">
                  <Navigation className="w-5 h-5 text-gray-700 dark:text-gray-200 group-hover:text-white dark:group-hover:text-black" />
                </div>
                <div>
                  <div className="font-bold text-base text-gray-900 dark:text-white">
                    {isLoadingGeo ? 'Locating...' : 'Use my current location'}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm your address */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1A1A1A] border border-transparent dark:border-gray-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between relative">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setIsAddressModalOpen(true);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1 pr-8 text-airbnb-black dark:text-white">Confirm your address</h2>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>

            <form onSubmit={handleConfirmNext} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Stacked Form Group matching Airbnb screenshot */}
              <div className="border border-gray-400 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-300 dark:divide-gray-700 shadow-xs">
                <div className="p-3 bg-white dark:bg-[#262626]">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                    Country/region
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-transparent font-semibold text-base outline-none cursor-pointer text-gray-900 dark:text-white"
                  >
                    <option value="India - IN" className="dark:bg-[#262626]">India - IN</option>
                    <option value="United States - US" className="dark:bg-[#262626]">United States - US</option>
                    <option value="United Kingdom - UK" className="dark:bg-[#262626]">United Kingdom - UK</option>
                  </select>
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <input
                    type="text"
                    placeholder="Flat, house, etc. (if applicable)"
                    value={flatHouse}
                    onChange={(e) => setFlatHouse(e.target.value)}
                    className="w-full bg-transparent text-base outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium text-gray-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                    Street address
                  </label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full bg-transparent text-base outline-none font-semibold text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <input
                    type="text"
                    placeholder="Nearby landmark (if applicable)"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-transparent text-base outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium text-gray-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <input
                    type="text"
                    placeholder="District/locality (if applicable)"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full bg-transparent text-base outline-none placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium text-gray-900 dark:text-white"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                    City/town
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent text-base outline-none font-semibold text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                    State/union territory
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-transparent text-base outline-none font-semibold text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div className="p-3 bg-white dark:bg-[#262626]">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                    PIN code
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-transparent text-base outline-none font-semibold text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#222222] dark:bg-white text-white dark:text-black font-bold text-base rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-all shadow-md active:scale-[0.98] cursor-pointer mt-6"
              >
                Next
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
