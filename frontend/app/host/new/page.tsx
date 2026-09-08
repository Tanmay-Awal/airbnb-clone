'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { apiCreateListing, apiGetAllAmenities } from '@/lib/api';
import { Amenity } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';

export default function CreateListingPage() {
  const router = useRouter();
  const { currentUser, isHost } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Villa');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState<number>(5000);
  const [maxGuests, setMaxGuests] = useState<number>(4);
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [beds, setBeds] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiGetAllAmenities().then(setAllAmenities).catch(console.error);
  }, []);

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleAmenity = (id: number) => {
    if (selectedAmenityIds.includes(id)) {
      setSelectedAmenityIds(selectedAmenityIds.filter((a) => a !== id));
    } else {
      setSelectedAmenityIds([...selectedAmenityIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || pricePerNight <= 0) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title,
        description,
        property_type: propertyType,
        location,
        price_per_night: pricePerNight,
        max_guests: maxGuests,
        bedrooms,
        beds,
        bathrooms,
        amenity_ids: selectedAmenityIds,
        images: images.map((url, idx) => ({ url, position: idx })),
      };

      const newListing = await apiCreateListing(payload, currentUser?.id);
      showToast('Property listing created successfully!', 'success');
      router.push(`/listings/${newListing.id}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to create listing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = ['Villa', 'Apartment', 'Cabin', 'Heritage Home', 'Cottage'];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="max-w-[800px] mx-auto w-full px-4 sm:px-6 py-10 flex-1">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-airbnb-grey hover:text-airbnb-black mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Host Dashboard</span>
        </button>

        <h1 className="text-3xl font-bold text-airbnb-black mb-2">Create a New Property Listing</h1>
        <p className="text-sm text-airbnb-grey mb-8">Fill out the details to list your property on Airbnb</p>

        <form onSubmit={handleSubmit} className="space-y-8 border border-airbnb-border rounded-3xl p-8 bg-white shadow-xs">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-airbnb-black">Basic Information</h3>
            <div>
              <label className="block text-xs font-bold text-airbnb-black mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Luxury Beachfront Villa with Infinity Pool"
                className="w-full p-3 border border-airbnb-border rounded-xl focus:outline-none focus:border-airbnb-black text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-airbnb-black mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Candolim, Goa"
                className="w-full p-3 border border-airbnb-border rounded-xl focus:outline-none focus:border-airbnb-black text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full p-3 border border-airbnb-border rounded-xl focus:outline-none focus:border-airbnb-black text-sm bg-white"
                >
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Price per Night (₹)</label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-airbnb-border rounded-xl focus:outline-none focus:border-airbnb-black text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-airbnb-black mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what makes your stay unique..."
                className="w-full p-3 border border-airbnb-border rounded-xl focus:outline-none focus:border-airbnb-black text-sm"
                required
              />
            </div>
          </div>

          <div className="border-t border-airbnb-border" />

          {/* Property Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-airbnb-black">Capacity & Layout</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Max Guests</label>
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-airbnb-border rounded-xl text-sm"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-airbnb-border rounded-xl text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Beds</label>
                <input
                  type="number"
                  value={beds}
                  onChange={(e) => setBeds(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-airbnb-border rounded-xl text-sm"
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-airbnb-black mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-airbnb-border rounded-xl text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-airbnb-border" />

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-airbnb-black">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allAmenities.map((a) => {
                const isSelected = selectedAmenityIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleAmenity(a.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected ? 'border-airbnb-black bg-rose-50' : 'border-airbnb-border bg-white hover:border-airbnb-black'
                    }`}
                  >
                    <span>{a.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-airbnb-red" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-airbnb-border" />

          {/* Image Gallery URLs */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-airbnb-black">Image Gallery</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste Image URL (Unsplash, etc.)"
                className="flex-1 p-3 border border-airbnb-border rounded-xl text-sm focus:outline-none focus:border-airbnb-black"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-3 bg-airbnb-black text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
              >
                Add Photo
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-airbnb-border">
                  <img src={url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-white font-bold text-base rounded-xl shadow-md hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Listing...' : 'Publish Property Listing'}
          </button>
        </form>
      </main>
    </div>
  );
}
