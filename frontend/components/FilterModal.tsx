'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { apiGetAllAmenities } from '@/lib/api';
import { Amenity, ListingCard } from '@/types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: {
    min_price?: number;
    max_price?: number;
    property_type?: string;
    amenities?: string[];
  }) => void;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialPropertyType?: string;
  initialAmenities?: string[];
  availableListings?: ListingCard[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialMinPrice,
  initialMaxPrice,
  initialPropertyType = '',
  initialAmenities = [],
  availableListings,
}) => {
  const [minPrice, setMinPrice] = useState<string>(initialMinPrice ? initialMinPrice.toString() : '');
  const [maxPrice, setMaxPrice] = useState<string>(initialMaxPrice ? initialMaxPrice.toString() : '');
  const [propertyType, setPropertyType] = useState<string>(initialPropertyType);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);

  useEffect(() => {
    if (isOpen) {
      apiGetAllAmenities()
        .then(setAllAmenities)
        .catch((err) => console.error('Failed to load amenities:', err));
    }
  }, [isOpen]);

  // Always present complete property types list so user can deselect or pick another type
  const allPropertyTypesList = ['Apartment', 'Villa', 'House', 'Cabin', 'Heritage Home', 'Cottage'];

  const availablePropertyTypes = React.useMemo(() => {
    const typesSet = new Set<string>(allPropertyTypesList);
    if (availableListings && availableListings.length > 0) {
      availableListings.forEach((item) => {
        if (item.property_type && item.property_type.trim()) {
          typesSet.add(item.property_type.trim());
        }
      });
    }
    if (initialPropertyType && initialPropertyType.trim()) {
      typesSet.add(initialPropertyType.trim());
    }
    return Array.from(typesSet);
  }, [availableListings, initialPropertyType]);

  // Dynamically derive available amenities from current search results
  const displayAmenities = React.useMemo(() => {
    if (!availableListings || availableListings.length === 0) {
      return allAmenities;
    }
    const availableAmenityNames = new Set<string>();
    availableListings.forEach((item) => {
      if (item.amenities && Array.isArray(item.amenities)) {
        item.amenities.forEach((a) => availableAmenityNames.add(a.toLowerCase().trim()));
      }
    });
    if (selectedAmenities && selectedAmenities.length > 0) {
      selectedAmenities.forEach((a) => availableAmenityNames.add(a.toLowerCase().trim()));
    }

    if (availableAmenityNames.size === 0) {
      return allAmenities;
    }

    const filtered = allAmenities.filter((a) => availableAmenityNames.has(a.name.toLowerCase().trim()));
    return filtered.length > 0 ? filtered : allAmenities;
  }, [allAmenities, availableListings, selectedAmenities]);

  const toggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleApply = () => {
    onApplyFilters({
      min_price: minPrice ? parseInt(minPrice, 10) : undefined,
      max_price: maxPrice ? parseInt(maxPrice, 10) : undefined,
      property_type: propertyType || undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    });
    onClose();
  };

  const handleClearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setPropertyType('');
    setSelectedAmenities([]);
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
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-white dark:bg-[#1E1E1E] w-full max-w-2xl rounded-3xl shadow-airbnb-modal border border-airbnb-border dark:border-gray-800 overflow-hidden max-h-[90vh] flex flex-col z-10 text-airbnb-black dark:text-gray-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-airbnb-border dark:border-gray-800">
            <button
              onClick={onClose}
              className="p-2 hover:bg-airbnb-lightGrey dark:hover:bg-[#2A2A2A] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-airbnb-black dark:text-gray-200" />
            </button>
            <h2 className="text-base font-bold text-airbnb-black dark:text-white">Filters</h2>
            <div className="w-9" />
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
            {/* Price Range */}
            <div>
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-1">Price range</h3>
              <p className="text-xs text-airbnb-grey dark:text-gray-400 mb-4">Nightly prices before taxes and fees</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-airbnb-grey dark:text-gray-400 mb-1 font-medium">Minimum</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-airbnb-black dark:text-gray-200 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-[#262626] border border-airbnb-border dark:border-gray-700 rounded-xl focus:outline-none focus:border-airbnb-black dark:focus:border-white text-sm text-airbnb-black dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-airbnb-grey dark:text-gray-400 mb-1 font-medium">Maximum</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-airbnb-black dark:text-gray-200 font-semibold text-sm">₹</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="50000+"
                      className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-[#262626] border border-airbnb-border dark:border-gray-700 rounded-xl focus:outline-none focus:border-airbnb-black dark:focus:border-white text-sm text-airbnb-black dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-airbnb-border dark:border-gray-800" />

            {/* Property Type */}
            <div>
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-4">Property type</h3>
              <div className="flex flex-wrap gap-3">
                {availablePropertyTypes.map((type) => {
                  const isSelected = propertyType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setPropertyType(isSelected ? '' : type)}
                      className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-airbnb-black dark:bg-white text-white dark:text-black border-airbnb-black dark:border-white'
                          : 'bg-white dark:bg-[#262626] text-airbnb-black dark:text-gray-200 border-airbnb-border dark:border-gray-700 hover:border-airbnb-black dark:hover:border-white'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-airbnb-border dark:border-gray-800" />

            {/* Amenities */}
            <div>
              <h3 className="text-lg font-bold text-airbnb-black dark:text-white mb-4">Amenities</h3>
              <div className="grid grid-cols-2 gap-3">
                {displayAmenities.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity.name);
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.name)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-airbnb-black dark:border-white bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-airbnb-border dark:border-gray-700 hover:border-airbnb-black dark:hover:border-white bg-white dark:bg-[#262626]'
                      }`}
                    >
                      <span className="text-xs font-medium text-airbnb-black dark:text-gray-200">{amenity.name}</span>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-airbnb-black dark:bg-white border-airbnb-black dark:border-white text-white dark:text-black' : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-airbnb-border dark:border-gray-800 bg-white dark:bg-[#1E1E1E]">
            <button
              onClick={handleClearAll}
              className="text-sm font-semibold text-airbnb-black dark:text-gray-200 underline hover:text-black dark:hover:text-white cursor-pointer"
            >
              Clear all
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-3 bg-airbnb-black dark:bg-white text-white dark:text-black font-semibold text-sm rounded-xl hover:bg-black dark:hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Show stays
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
