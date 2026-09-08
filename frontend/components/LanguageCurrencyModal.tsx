'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLocale, CURRENCIES } from '@/context/LocaleContext';

export const LanguageCurrencyModal: React.FC = () => {
  const {
    currency, setCurrency,
    showLocaleModal, setShowLocaleModal,
  } = useLocale();

  if (!showLocaleModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => setShowLocaleModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1A1A1A] rounded-2xl w-full max-w-[1032px] max-h-[85vh] mx-4 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-airbnb-black dark:text-white">Choose a currency</h2>
          <button
            onClick={() => setShowLocaleModal(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-airbnb-black dark:text-white" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CURRENCIES.map((curr) => (
              <button
                key={curr.code}
                onClick={() => { setCurrency(curr); setShowLocaleModal(false); }}
                className={`text-left p-3.5 rounded-xl border cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#262626] ${
                  currency.code === curr.code
                    ? 'border-2 border-airbnb-black dark:border-white bg-gray-50 dark:bg-[#262626] font-bold'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="text-sm font-semibold text-airbnb-black dark:text-white">{curr.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{curr.code} – {curr.symbol}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
