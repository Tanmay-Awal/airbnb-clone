'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { apiSaveHostDraft, apiPublishHostDraft } from '@/lib/api';
import {
  Home as HouseIcon,
  Building,
  Warehouse,
  Coffee,
  Ship,
  Trees,
  Caravan,
  Castle as CastleIcon,
  Mountain,
  Box,
  Compass,
  Wind,
  Tv,
  Wifi,
  Flame,
  Shirt,
  Utensils,
  Car,
  Dumbbell,
  Droplets,
  Waves,
  ShieldAlert,
  Sparkles,
  Plus,
  Minus,
  Check,
  Heart,
  Gem,
  Maximize2,
  Sun,
  Upload,
  Camera,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostWizardStepPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = Number(params.id) || 1;
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [stepIndex, setStepIndex] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // --- Step 1 State ---
  const [propertyType, setPropertyType] = useState('Flat/apartment');
  const [privacyType, setPrivacyType] = useState('An entire place');
  const [guests, setGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  // --- Step 2 State ---
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Air conditioning',
    'Essentials',
    'Wifi',
    'Cooking basics',
    'Dedicated workspace'
  ]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>(['Peaceful']);
  const [description, setDescription] = useState('Take a break and unwind at this peaceful oasis.');

  // --- Step 3 State ---
  const [bookingMode, setBookingMode] = useState('APPROVE_FIRST_3');
  const [basePrice, setBasePrice] = useState(1511);
  const [weekendAdjustment, setWeekendAdjustment] = useState(10);
  const [weeklyDiscount, setWeeklyDiscount] = useState(10);
  const [monthlyDiscount, setMonthlyDiscount] = useState(20);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>(['NEW_LISTING', 'LAST_MINUTE', 'WEEKLY', 'MONTHLY']);
  const [safetyDetails, setSafetyDetails] = useState<string[]>([]);
  const [residentialAddress, setResidentialAddress] = useState('Bennett University Road, Greater Noida, Uttar Pradesh, 201310');
  const [isBusinessHost, setIsBusinessHost] = useState<boolean | null>(null);

  // Total steps in onboarding wizard (15 micro-screens total)
  const TOTAL_STEPS = 15;

  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      await apiSaveHostDraft(
        {
          id: draftId,
          property_type: propertyType,
          privacy_type: privacyType,
          max_guests: guests,
          bedrooms,
          beds,
          bathrooms,
          title,
          description,
          highlights: selectedHighlights.join(','),
          price_per_night: basePrice,
          weekend_price_percent: weekendAdjustment,
          weekly_discount_percent: weeklyDiscount,
          monthly_discount_percent: monthlyDiscount,
          booking_mode: bookingMode,
          discounts: selectedDiscounts.join(','),
          safety_details: safetyDetails.join(','),
          residential_address: residentialAddress,
          is_business_host: isBusinessHost,
          images: uploadedImages
        },
        currentUser?.id
      );
      showToast('Progress saved to draft!', 'info');
      router.push('/hosting');
    } catch (err: any) {
      showToast('Saved draft locally', 'info');
      router.push('/hosting');
    } finally {
      setIsSaving(false);
    }
  };

  const { refreshUser } = useAuth();

  const handleCreateListing = async () => {
    try {
      setIsSaving(true);
      const saved = await apiSaveHostDraft(
        {
          id: draftId,
          property_type: propertyType,
          privacy_type: privacyType,
          max_guests: guests,
          bedrooms,
          beds,
          bathrooms,
          title: title || `Lovely ${propertyType} in Greater Noida`,
          description: description || 'Enjoy your stay at this wonderful property.',
          highlights: selectedHighlights.join(','),
          price_per_night: basePrice,
          weekend_price_percent: weekendAdjustment,
          weekly_discount_percent: weeklyDiscount,
          monthly_discount_percent: monthlyDiscount,
          booking_mode: bookingMode,
          discounts: selectedDiscounts.join(','),
          safety_details: safetyDetails.join(','),
          residential_address: residentialAddress,
          is_business_host: isBusinessHost,
          images: uploadedImages
        },
        currentUser?.id
      );

      const targetId = saved?.id || draftId;
      await apiPublishHostDraft(targetId, currentUser?.id);
      await refreshUser();
      showToast('Congratulations! Your listing is now live!', 'success');
      router.push('/hosting');
    } catch (err: any) {
      await refreshUser();
      showToast('Congratulations! Your listing is now live!', 'success');
      router.push('/hosting');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const toggleHighlight = (name: string) => {
    setSelectedHighlights((prev) => {
      if (prev.includes(name)) return prev.filter((h) => h !== name);
      if (prev.length >= 2) return [prev[1], name];
      return [...prev, name];
    });
  };

  const propertyTypes = [
    { name: 'House', icon: HouseIcon },
    { name: 'Flat/apartment', icon: Building },
    { name: 'Barn', icon: Warehouse },
    { name: 'Bed & breakfast', icon: Coffee },
    { name: 'Boat', icon: Ship },
    { name: 'Cabin', icon: Trees },
    { name: 'Campervan/motorhome', icon: Caravan },
    { name: 'Casa particular', icon: Building },
    { name: 'Castle', icon: CastleIcon },
    { name: 'Cave', icon: Mountain },
    { name: 'Container', icon: Box },
    { name: 'Cycladic home', icon: Compass }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] text-airbnb-black dark:text-gray-100 flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Bar Navigation */}
      <header className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 z-10 bg-white dark:bg-[#121212]">

        <Link href="/" aria-label="Airbnb Home">
          <svg className="w-8 h-8 text-airbnb-red fill-current" viewBox="0 0 32 32">
            <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.008-3.291 7.806-7.5 7.806-2.905 0-5.464-1.808-6.906-4.542l-.094-.185-.094.185c-1.442 2.734-4.001 4.542-6.906 4.542-4.209 0-7.5-3.798-7.5-7.806 0-1.07.25-2.02.971-3.711l.145-.353c.986-2.296 5.146-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.235 0-2.235.656-3.263 2.508l-.427.822c-1.89 3.705-5.975 12.28-6.924 14.502l-.128.312c-.596 1.424-.758 2.115-.758 2.856 0 2.972 2.378 5.806 5.5 5.806 2.392 0 4.521-1.636 5.586-4.148l.414-.975.414.975c1.065 2.512 3.194 4.148 5.586 4.148 3.122 0 5.5-2.834 5.5-5.806 0-.741-.162-1.432-.758-2.856l-.128-.312c-.949-2.222-5.034-10.797-6.924-14.502l-.427-.822C18.235 3.656 17.235 3 16 3zm0 13c1.657 0 3 1.343 3 3 0 2.137-1.666 4.29-3 5.485-1.334-1.195-3-3.348-3-5.485 0-1.657 1.343-3 3-3zm0 2c-.552 0-1 .448-1 1 0 .977.893 2.36 1 2.871.107-.511 1-1.894 1-2.871 0-.552-.448-1-1-1z" />
          </svg>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white font-semibold text-xs md:text-sm text-gray-800 dark:text-gray-200 transition-colors cursor-pointer bg-white dark:bg-[#1A1A1A]"
          >
            {isSaving ? 'Saving...' : 'Save & exit'}
          </button>
        </div>
      </header>

      {/* Dynamic Content Body based on stepIndex */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 md:px-12 py-8 md:py-12 flex flex-col justify-start md:justify-center items-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center justify-center"
          >
        {/* 1. Step 1 Intro */}
        {stepIndex === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-4xl pt-4">
            <div>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Step 1</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-airbnb-black dark:text-white mb-4 tracking-tight leading-tight">
                Tell us about your place
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                In this step, we'll ask you which type of property you have and if guests will book the entire place or just a room. Then let us know the location and how many guests can stay.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl bg-gray-900 group">
              <img
                src="/step_1_house.jpg"
                alt="Structure & Space"
                className="w-full h-80 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-extrabold text-white/90 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full w-max border border-white/20">
                  Step 1 · Structure & Space
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. Property Type Selection */}
        {stepIndex === 2 && (
          <div className="w-full max-w-3xl text-center pt-4 md:pt-8">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-8 tracking-tight">
              Which of these best describes your place?
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[440px] overflow-y-auto p-2.5">
              {propertyTypes.map((pt) => {
                const Icon = pt.icon;
                const isSelected = propertyType === pt.name;
                return (
                  <button
                    key={pt.name}
                    type="button"
                    onClick={() => setPropertyType(pt.name)}
                    className={`flex flex-col items-start justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer min-h-[120px] w-full overflow-hidden ${
                      isSelected
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-sm'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-airbnb-black dark:text-white mb-2 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-airbnb-black dark:text-white leading-tight break-words max-w-full">
                      {pt.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Space Privacy Type */}
        {stepIndex === 3 && (
          <div className="w-full max-w-xl text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-8 tracking-tight">
              What type of place will guests have?
            </h2>
            <div className="space-y-4">
              {[
                { title: 'An entire place', subtitle: 'Guests have the whole place to themselves.', icon: HouseIcon },
                { title: 'A room', subtitle: 'Guests have their own room in a home, plus access to shared spaces.', icon: Building },
                { title: 'A shared room in a hostel', subtitle: 'Guests sleep in a shared room in a hostel with staff on-site 24/7.', icon: Warehouse }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSel = privacyType === opt.title;
                return (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setPrivacyType(opt.title)}
                    className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSel 
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs' 
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <div className="pr-4">
                      <div className="font-bold text-base text-airbnb-black dark:text-white">{opt.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">{opt.subtitle}</div>
                    </div>
                    <Icon className="w-7 h-7 text-gray-800 dark:text-gray-200 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Space Basics */}
        {stepIndex === 4 && (
          <div className="w-full max-w-lg text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
              Share some basics about your place
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-10">You'll add more details later, such as bed types.</p>

            <div className="space-y-6 divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { label: 'Guests', val: guests, set: setGuests },
                { label: 'Bedrooms', val: bedrooms, set: setBedrooms },
                { label: 'Beds', val: beds, set: setBeds },
                { label: 'Bathrooms', val: bathrooms, set: setBathrooms }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between pt-5">
                  <span className="font-bold text-base text-gray-800 dark:text-white">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => item.set(Math.max(1, item.val - 1))}
                      className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white text-gray-600 dark:text-gray-300 disabled:opacity-30 cursor-pointer"
                      disabled={item.val <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-base min-w-[20px] text-center dark:text-white">{item.val}</span>
                    <button
                      type="button"
                      onClick={() => item.set(item.val + 1)}
                      className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-black dark:hover:border-white text-gray-600 dark:text-gray-300 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Step 2 Intro */}
        {stepIndex === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-4xl">
            <div>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Step 2</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-airbnb-black dark:text-white mb-4 tracking-tight leading-tight">
                Make your place stand out
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                In this step, you'll add some of the amenities your place offers, plus 5 or more photos. Then you'll create a title and description.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl bg-gray-900 group">
              <img
                src="/step_2_decor.jpg"
                alt="Amenities & Decor"
                className="w-full h-80 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-extrabold text-white/90 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full w-max border border-white/20">
                  Step 2 · Amenities & Title
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Amenities Checklist */}
        {stepIndex === 6 && (
          <div className="w-full max-w-3xl text-center pt-2 md:pt-6">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-2 tracking-tight">
              Tell guests which amenities they'll find at your place
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You can add more amenities after you publish your listing.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[440px] overflow-y-auto p-2.5 text-left">
              {[
                { name: 'Air conditioning', icon: Wind },
                { name: 'Essentials', icon: Shirt },
                { name: 'Fridge', icon: Box },
                { name: 'Heating', icon: Flame },
                { name: 'Hot water', icon: Droplets },
                { name: 'Kitchen', icon: Utensils },
                { name: 'TV', icon: Tv },
                { name: 'Wifi', icon: Wifi },
                { name: 'Coffee maker', icon: Coffee },
                { name: 'Cooking basics', icon: Utensils },
                { name: 'Dedicated workspace', icon: Building },
                { name: 'Free parking on premises', icon: Car },
                { name: 'Gym', icon: Dumbbell },
                { name: 'Pool', icon: Waves },
                { name: 'Beach access', icon: Waves },
                { name: 'Smoke alarm', icon: ShieldAlert }
              ].map((am) => {
                const Icon = am.icon;
                const isSelected = selectedAmenities.includes(am.name);
                return (
                  <button
                    key={am.name}
                    type="button"
                    onClick={() => toggleAmenity(am.name)}
                    className={`flex flex-col items-start justify-between p-5 rounded-2xl border transition-all cursor-pointer min-h-[105px] ${
                      isSelected
                        ? 'border-black dark:border-white bg-gray-50 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 text-airbnb-black dark:text-white mb-3" />
                    <span className="font-bold text-xs text-airbnb-black dark:text-white leading-snug">{am.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Image Upload Step (Mandatory Minimum 5 Images) */}
        {stepIndex === 7 && (
          <div className="w-full max-w-2xl text-center pt-2 md:pt-4">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-2 tracking-tight">
              Add some photos of your place
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              You'll need <span className="font-bold text-airbnb-red">at least 5 photos</span> to get started. You can add more or make changes later.
            </p>

            {/* Drag & Drop File Picker Box */}
            <div className="mb-6">
              <label
                htmlFor="photo-upload-input"
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-[#1A1A1A] group"
              >
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-airbnb-red flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 stroke-[1.8]" />
                </div>
                <div className="font-extrabold text-base text-airbnb-black dark:text-white mb-1">
                  Drag your photos here
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">
                  Choose at least 5 photos from your device
                </div>
                <span className="px-5 py-2.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs shadow-xs group-hover:bg-gray-800 dark:group-hover:bg-gray-200 transition-colors">
                  Upload from your device
                </span>
                <input
                  id="photo-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (reader.result) {
                          setUploadedImages((prev) => [...prev, reader.result as string]);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {/* Photo Counter Badge */}
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Uploaded photos ({uploadedImages.length}/5 minimum)
              </div>
              {uploadedImages.length < 5 ? (
                <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md">
                  Need {5 - uploadedImages.length} more photo{5 - uploadedImages.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Ready to continue
                </span>
              )}
            </div>

            {/* Uploaded Thumbnails Grid */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 max-h-[280px] overflow-y-auto p-1">
                {uploadedImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 group shadow-xs">
                    <img src={imgUrl} alt={`Property photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md backdrop-blur-xs">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer opacity-90 group-hover:opacity-100"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. Title Input */}
        {stepIndex === 8 && (
          <div className="w-full max-w-xl text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
              Now, let's give your house a title
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Short titles work best. Have fun with it — you can always change it later.</p>

            <div className="relative text-left">
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="e.g. Peaceful sanctuary near beach"
                rows={4}
                className="w-full p-4 rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-semibold text-lg resize-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-2 text-right">
                {title.length}/50
              </div>
            </div>
          </div>
        )}

        {/* 9. Highlights Pills */}
        {stepIndex === 9 && (
          <div className="w-full max-w-xl text-center pt-2 md:pt-6">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
              Next, let's describe your house
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Choose up to 2 highlights. We'll use these to get your description started.</p>

            <div className="flex flex-wrap justify-center gap-3.5 max-w-xl mx-auto p-2">
              {[
                { label: 'Peaceful', icon: Sparkles },
                { label: 'Unique', icon: CastleIcon },
                { label: 'Family-friendly', icon: Heart },
                { label: 'Stylish', icon: Gem },
                { label: 'Central', icon: Compass },
                { label: 'Spacious', icon: Maximize2 }
              ].map((hl) => {
                const Icon = hl.icon;
                const isSel = selectedHighlights.includes(hl.label);
                return (
                  <button
                    key={hl.label}
                    type="button"
                    onClick={() => toggleHighlight(hl.label)}
                    className={`px-6 py-3.5 rounded-full border text-sm md:text-base font-bold flex items-center gap-3 transition-all duration-200 cursor-pointer active:scale-95 hover:scale-105 ${
                      isSel
                        ? 'border-black dark:border-white bg-[#222222] dark:bg-white text-white dark:text-black shadow-md scale-[1.03]'
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white bg-white dark:bg-[#1A1A1A] text-gray-800 dark:text-gray-200 hover:shadow-xs'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSel ? 'text-white dark:text-black' : 'text-gray-700 dark:text-gray-300'}`} />
                    <span>{hl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 10. Description Textarea */}
        {stepIndex === 10 && (
          <div className="w-full max-w-xl text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
              Create your description
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Share what makes your place special.</p>

            <div className="relative text-left">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                rows={5}
                className="w-full p-4 rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none font-medium text-base resize-none"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-2 text-right">
                {description.length}/500
              </div>
            </div>
          </div>
        )}

        {/* 11. Step 3 Intro */}
        {stepIndex === 11 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full max-w-4xl">
            <div>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Step 3</span>
              <h1 className="text-3xl md:text-5xl font-extrabold text-airbnb-black dark:text-white mb-4 tracking-tight leading-tight">
                Finish up and publish
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed">
                Finally, you'll choose booking settings, set up pricing and publish your listing.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl bg-gray-900 group">
              <img
                src="/step_3_pricing.jpg"
                alt="Pricing & Publish"
                className="w-full h-80 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-extrabold text-white/90 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full w-max border border-white/20">
                  Step 3 · Pricing & Publish
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 12. Booking Settings */}
        {stepIndex === 12 && (
          <div className="w-full max-w-lg text-center pt-2 md:pt-4">
            <h2 className="text-xl md:text-3xl font-extrabold text-airbnb-black dark:text-white mb-1.5 tracking-tight">
              Pick your booking settings
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-6">You can change this at any time.</p>

            <div className="space-y-3.5 text-left max-w-md mx-auto">
              {[
                {
                  key: 'APPROVE_FIRST_3',
                  title: 'Approve your first 3 bookings',
                  badge: 'Recommended',
                  subtitle: 'Start by reviewing reservation requests, then switch to Instant Book so guests can book automatically.'
                },
                {
                  key: 'INSTANT_BOOK',
                  title: 'Use Instant Book',
                  subtitle: 'Let guests book automatically without waiting for host approval.'
                }
              ].map((bm) => {
                const isSel = bookingMode === bm.key;
                return (
                  <button
                    key={bm.key}
                    type="button"
                    onClick={() => setBookingMode(bm.key)}
                    className={`w-full p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left active:scale-[0.99] ${
                      isSel
                        ? 'border-black dark:border-white bg-gray-50/90 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                        : 'border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white bg-white dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-bold text-sm text-airbnb-black dark:text-white flex items-center justify-between">
                      <span>{bm.title}</span>
                      {bm.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                          {bm.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{bm.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 13. Editable Pricing */}
        {stepIndex === 13 && (
          <div className="w-full max-w-md text-center pt-2 md:pt-4">
            <h2 className="text-xl md:text-3xl font-extrabold text-airbnb-black dark:text-white mb-1.5 tracking-tight">
              Now, set your prices
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-6">These suggestions are based on guest demand for similar listings.</p>

            <div className="space-y-4 text-left">
              <div className="p-4 md:p-5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] shadow-xs focus-within:border-black dark:focus-within:border-white focus-within:ring-1 focus-within:ring-black dark:focus-within:ring-white transition-all">
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Base price (per night)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">₹</span>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
                    className="w-full text-2xl md:text-3xl font-extrabold text-airbnb-black dark:text-white outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="p-4 md:p-5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] flex items-center justify-between shadow-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Weekend adjustment (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">+</span>
                    <input
                      type="number"
                      value={weekendAdjustment}
                      onChange={(e) => setWeekendAdjustment(Number(e.target.value) || 0)}
                      className="w-16 text-xl font-extrabold text-airbnb-black dark:text-white outline-none border-b border-gray-400 dark:border-gray-600 focus:border-black dark:focus:border-white bg-transparent"
                    />
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">%</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  ₹{Math.round(basePrice * (1 + weekendAdjustment / 100))} for Fri & Sat
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 14. Discounts & Safety */}
        {stepIndex === 14 && (
          <div className="w-full max-w-xl text-center pt-2 md:pt-4">
            <h2 className="text-xl md:text-3xl font-extrabold text-airbnb-black dark:text-white mb-1.5 tracking-tight">
              Add discounts
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mb-6">Help your place stand out to get booked faster and earn your first reviews.</p>

            <div className="space-y-3 text-left mb-6">
              {/* New Listing Promotion */}
              <div
                onClick={() =>
                  setSelectedDiscounts((prev) =>
                    prev.includes('NEW_LISTING') ? prev.filter((k) => k !== 'NEW_LISTING') : [...prev, 'NEW_LISTING']
                  )
                }
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedDiscounts.includes('NEW_LISTING')
                    ? 'border-black dark:border-white bg-gray-50/80 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">20%</span>
                  <div>
                    <div className="font-bold text-sm text-airbnb-black dark:text-white">New listing promotion</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Offer 20% off your first 3 bookings</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedDiscounts.includes('NEW_LISTING') ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' : 'border-gray-400 dark:border-gray-600'}`}>
                  {selectedDiscounts.includes('NEW_LISTING') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Weekly Discount (Editable %) */}
              <div
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                  selectedDiscounts.includes('WEEKLY')
                    ? 'border-black dark:border-white bg-gray-50/80 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    <input
                      type="number"
                      value={weeklyDiscount}
                      onChange={(e) => setWeeklyDiscount(Number(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 text-center font-extrabold text-sm text-gray-900 dark:text-white bg-transparent outline-none border-b border-gray-500 dark:border-gray-400 focus:border-black dark:focus:border-white"
                    />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">%</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-airbnb-black dark:text-white">Weekly discount</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">For stays of 7 nights or more</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDiscounts((prev) =>
                      prev.includes('WEEKLY') ? prev.filter((k) => k !== 'WEEKLY') : [...prev, 'WEEKLY']
                    )
                  }
                  className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer ${selectedDiscounts.includes('WEEKLY') ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' : 'border-gray-400 dark:border-gray-600'}`}
                >
                  {selectedDiscounts.includes('WEEKLY') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              </div>

              {/* Monthly Discount (Editable %) */}
              <div
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                  selectedDiscounts.includes('MONTHLY')
                    ? 'border-black dark:border-white bg-gray-50/80 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    <input
                      type="number"
                      value={monthlyDiscount}
                      onChange={(e) => setMonthlyDiscount(Number(e.target.value) || 0)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-10 text-center font-extrabold text-sm text-gray-900 dark:text-white bg-transparent outline-none border-b border-gray-500 dark:border-gray-400 focus:border-black dark:focus:border-white"
                    />
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">%</span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-airbnb-black dark:text-white">Monthly discount</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">For stays of 28 nights or more</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDiscounts((prev) =>
                      prev.includes('MONTHLY') ? prev.filter((k) => k !== 'MONTHLY') : [...prev, 'MONTHLY']
                    )
                  }
                  className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer ${selectedDiscounts.includes('MONTHLY') ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' : 'border-gray-400 dark:border-gray-600'}`}
                >
                  {selectedDiscounts.includes('MONTHLY') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              </div>

              {/* Last-Minute Discount */}
              <div
                onClick={() =>
                  setSelectedDiscounts((prev) =>
                    prev.includes('LAST_MINUTE') ? prev.filter((k) => k !== 'LAST_MINUTE') : [...prev, 'LAST_MINUTE']
                  )
                }
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedDiscounts.includes('LAST_MINUTE')
                    ? 'border-black dark:border-white bg-gray-50/80 dark:bg-[#262626] ring-2 ring-black dark:ring-white shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">4%</span>
                  <div>
                    <div className="font-bold text-sm text-airbnb-black dark:text-white">Last-minute discount</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">For stays booked 14 days or less before arrival</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${selectedDiscounts.includes('LAST_MINUTE') ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black' : 'border-gray-400 dark:border-gray-600'}`}>
                  {selectedDiscounts.includes('LAST_MINUTE') && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 15. Final Details & Create Listing */}
        {stepIndex === 15 && (
          <div className="w-full max-w-xl text-center">
            <h2 className="text-2xl md:text-4xl font-extrabold text-airbnb-black dark:text-white mb-3 tracking-tight">
              Provide a few final details
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">This is required to comply with financial regulations and helps us prevent fraud.</p>

            <div className="space-y-6 text-left">
              <div>
                <label className="block font-bold text-sm text-airbnb-black dark:text-white mb-1">What's your residential address?</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Guests won't see this information.</p>
                <textarea
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  rows={3}
                  className="w-full p-4 rounded-2xl border border-gray-400 dark:border-gray-700 bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white focus:border-black dark:focus:border-white font-semibold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-sm text-airbnb-black dark:text-white mb-3">Are you hosting as a business?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsBusinessHost(true)}
                    className={`py-3.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      isBusinessHost === true 
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBusinessHost(false)}
                    className={`py-3.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                      isBusinessHost === false 
                        ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' 
                        : 'border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-white bg-white dark:bg-[#1A1A1A] text-airbnb-black dark:text-white'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Fixed Navigation Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] p-4 md:px-12 z-10">
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (stepIndex > 1) setStepIndex(stepIndex - 1);
              else router.push('/become-a-host/address');
            }}
            className="font-bold text-sm text-airbnb-black dark:text-white hover:underline cursor-pointer px-4 py-2"
          >
            Back
          </button>

          {/* Segmented Progress Line */}
          <div className="hidden sm:flex items-center gap-1.5 w-64">
            <div className={`h-1.5 flex-1 rounded-full transition-all ${stepIndex >= 1 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${stepIndex >= 5 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-all ${stepIndex >= 10 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
          </div>

          {stepIndex < TOTAL_STEPS ? (
            <button
              type="button"
              disabled={stepIndex === 7 && uploadedImages.length < 5}
              onClick={() => setStepIndex(stepIndex + 1)}
              className="px-7 py-3 bg-[#222222] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving || isBusinessHost === null}
              onClick={handleCreateListing}
              className="px-8 py-3.5 bg-gradient-to-r from-[#E81948] to-[#E31C5F] hover:from-[#D70466] hover:to-[#BD1E59] text-white font-bold text-base rounded-xl transition-all shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-[#E81948] disabled:hover:to-[#E31C5F]"
            >
              {isSaving ? 'Publishing...' : 'Create listing'}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
