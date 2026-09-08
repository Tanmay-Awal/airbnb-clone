'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Home, MapPin, DollarSign, Users, Bed, Bath, Sparkles } from 'lucide-react';
import { apiUpdateListing } from '@/lib/api';
import { useToast } from '@/components/Toast';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  onUpdated?: (updatedListing: any) => void;
}

export function EditListingModal({ isOpen, onClose, listing, onUpdated }: EditListingModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State pre-filled from listing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Entire Villa');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState<number | string>(1500);
  const [maxGuests, setMaxGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(2);
  const [beds, setBeds] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setDescription(listing.description || '');
      setPropertyType(listing.property_type || listing.category === 'homes' ? 'Entire Villa' : 'Apartment');
      setLocation(listing.location || '');
      setPricePerNight(listing.price_per_night || 1500);
      setMaxGuests(listing.max_guests || 4);
      setBedrooms(listing.bedrooms || 2);
      setBeds(listing.beds || 2);
      setBathrooms(listing.bathrooms || 2);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Listing title is required', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        property_type: propertyType,
        location: location.trim(),
        price_per_night: Number(pricePerNight) || 1500,
        max_guests: Number(maxGuests) || 1,
        bedrooms: Number(bedrooms) || 1,
        beds: Number(beds) || 1,
        bathrooms: Number(bathrooms) || 1,
      };

      const updated = await apiUpdateListing(listing.id, payload);
      showToast('Listing updated successfully in database!', 'success');
      if (onUpdated) {
        onUpdated(updated || { ...listing, ...payload });
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to update listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-[#1C1C1E] text-airbnb-black dark:text-gray-100 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-250 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-[#1C1C1E] z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-airbnb-red flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-extrabold text-[#222222] dark:text-white tracking-tight">Edit listing details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 bg-white dark:bg-[#1C1C1E]">
          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>Basic Information</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Listing Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luxury Beachside Villa in Goa"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] font-semibold text-sm text-[#222222] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 font-semibold text-sm text-[#222222] dark:text-white bg-white dark:bg-[#2A2A2D] focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all cursor-pointer"
              >
                <option value="Entire Villa" className="dark:bg-[#2A2A2D] dark:text-white">Entire Villa</option>
                <option value="Apartment" className="dark:bg-[#2A2A2D] dark:text-white">Apartment</option>
                <option value="Independent House" className="dark:bg-[#2A2A2D] dark:text-white">Independent House</option>
                <option value="Guest Suite" className="dark:bg-[#2A2A2D] dark:text-white">Guest Suite</option>
                <option value="Cabin" className="dark:bg-[#2A2A2D] dark:text-white">Cabin</option>
                <option value="Tiny Home" className="dark:bg-[#2A2A2D] dark:text-white">Tiny Home</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your space, ambiance, surroundings, and highlights for guests..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] font-semibold text-sm text-[#222222] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none"
              />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* SECTION 2: Location & Pricing */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Location & Nightly Pricing</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Location / Address</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State, Country"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] font-semibold text-sm text-[#222222] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Price per night (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    min="100"
                    required
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    placeholder="1500"
                    className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2A2A2D] font-semibold text-sm text-[#222222] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* SECTION 3: Capacity & Rooms */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Guests & Rooms</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-center bg-gray-50/50 dark:bg-[#252528]">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Max Guests</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="w-full text-center font-extrabold text-lg text-black dark:text-white bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-center bg-gray-50/50 dark:bg-[#252528]">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Bedrooms</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full text-center font-extrabold text-lg text-black dark:text-white bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-center bg-gray-50/50 dark:bg-[#252528]">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Beds</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={beds}
                  onChange={(e) => setBeds(Number(e.target.value))}
                  className="w-full text-center font-extrabold text-lg text-black dark:text-white bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-center bg-gray-50/50 dark:bg-[#252528]">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">Bathrooms</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full text-center font-extrabold text-lg text-black dark:text-white bg-transparent outline-none border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#1C1C1E] z-10 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-airbnb-black dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
