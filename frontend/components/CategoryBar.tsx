'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Stays', icon: '✨' },
  { id: 'Villa', name: 'Villas', icon: '🏡' },
  { id: 'Apartment', name: 'Apartments', icon: '🏢' },
  { id: 'Cabin', name: 'Cabins', icon: '🪵' },
  { id: 'Heritage Home', name: 'Heritage', icon: '🏰' },
  { id: 'Cottage', name: 'Cottages', icon: '🏡' },
  { id: 'Beachfront', name: 'Beachfront', icon: '🏖️' },
  { id: 'Lakefront', name: 'Lakefront', icon: '⛵' },
  { id: 'Tropical', name: 'Tropical', icon: '🌴' },
  { id: 'Mansions', name: 'Mansions', icon: '🏛️' },
];

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenFilterModal: () => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  onOpenFilterModal,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border-b border-airbnb-border dark:border-gray-800 sticky top-20 z-20 py-3 shadow-xs transition-colors duration-200">
      <div className="max-w-[1760px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Scroll Left Button */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex p-2 rounded-full border border-airbnb-border dark:border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-[#262626] cursor-pointer z-10 text-airbnb-black dark:text-gray-100"
        >
          <ChevronLeft className="w-4 h-4 text-airbnb-black dark:text-gray-100" />
        </button>

        {/* Categories Horizontal Scroll Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth py-1 flex-1"
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center gap-2 pb-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 border-b-2 cursor-pointer group relative ${
                  isActive
                    ? 'border-airbnb-black dark:border-white text-airbnb-black dark:text-white opacity-100'
                    : 'border-transparent text-airbnb-grey dark:text-gray-400 opacity-70 hover:opacity-100 hover:text-airbnb-black dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl transition-transform duration-200 ease-out group-hover:scale-115 group-active:scale-95">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex p-2 rounded-full border border-airbnb-border dark:border-gray-700 hover:shadow-md transition-shadow bg-white dark:bg-[#262626] cursor-pointer z-10 text-airbnb-black dark:text-gray-100"
        >
          <ChevronRight className="w-4 h-4 text-airbnb-black dark:text-gray-100" />
        </button>

        {/* Filters Button */}
        <button
          onClick={onOpenFilterModal}
          className="flex items-center gap-2 border border-airbnb-border dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs font-semibold hover:border-airbnb-black dark:hover:border-gray-400 transition-colors cursor-pointer bg-white dark:bg-[#262626] text-airbnb-black dark:text-gray-100 flex-shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 text-airbnb-black dark:text-gray-100" />
          <span>Filters</span>
        </button>
      </div>
    </div>
  );
};
