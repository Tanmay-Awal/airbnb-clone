'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Language {
  code: string;
  name: string;
  region: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

interface LocaleContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  showLocaleModal: boolean;
  setShowLocaleModal: (v: boolean) => void;
  localeModalTab: 'language' | 'currency';
  setLocaleModalTab: (t: 'language' | 'currency') => void;
  openModal: (tab?: 'language' | 'currency') => void;
  formatPrice: (amountInINR: number | undefined | null) => string;
}

export const LANGUAGES: Language[] = [
  { code: 'en-IN', name: 'English', region: 'India' },
  { code: 'en-US', name: 'English', region: 'United States' },
  { code: 'en-GB', name: 'English', region: 'United Kingdom' },
  { code: 'hi-IN', name: 'हिन्दी', region: 'भारत' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', region: 'ಭಾರತ' },
  { code: 'mr-IN', name: 'मराठी', region: 'भारत' },
  { code: 'az-AZ', name: 'Azərbaycan dili', region: 'Azərbaycan' },
  { code: 'id-ID', name: 'Bahasa Indonesia', region: 'Indonesia' },
  { code: 'bs-BA', name: 'Bosanski', region: 'Bosna i Hercegovina' },
  { code: 'ca-ES', name: 'Català', region: 'Espanya' },
  { code: 'cs-CZ', name: 'Čeština', region: 'Česká republika' },
  { code: 'me-ME', name: 'Crnogorski', region: 'Crna Gora' },
  { code: 'da-DK', name: 'Dansk', region: 'Danmark' },
  { code: 'de-DE', name: 'Deutsch', region: 'Deutschland' },
  { code: 'de-AT', name: 'Deutsch', region: 'Österreich' },
  { code: 'de-CH', name: 'Deutsch', region: 'Schweiz' },
  { code: 'de-LU', name: 'Deutsch', region: 'Luxemburg' },
  { code: 'et-EE', name: 'Eesti', region: 'Eesti' },
  { code: 'en-AU', name: 'English', region: 'Australia' },
  { code: 'en-CA', name: 'English', region: 'Canada' },
  { code: 'en-GY', name: 'English', region: 'Guyana' },
  { code: 'en-IE', name: 'English', region: 'Ireland' },
  { code: 'en-NZ', name: 'English', region: 'New Zealand' },
  { code: 'en-SG', name: 'English', region: 'Singapore' },
  { code: 'en-AE', name: 'English', region: 'United Arab Emirates' },
  { code: 'es-ES', name: 'Español', region: 'España' },
  { code: 'es-MX', name: 'Español', region: 'México' },
  { code: 'es-AR', name: 'Español', region: 'Argentina' },
  { code: 'fr-FR', name: 'Français', region: 'France' },
  { code: 'fr-CA', name: 'Français', region: 'Canada' },
  { code: 'it-IT', name: 'Italiano', region: 'Italia' },
  { code: 'ja-JP', name: '日本語', region: '日本' },
  { code: 'ko-KR', name: '한국어', region: '대한민국' },
  { code: 'nl-NL', name: 'Nederlands', region: 'Nederland' },
  { code: 'pl-PL', name: 'Polski', region: 'Polska' },
  { code: 'pt-BR', name: 'Português', region: 'Brasil' },
  { code: 'pt-PT', name: 'Português', region: 'Portugal' },
  { code: 'ru-RU', name: 'Русский', region: 'Россия' },
  { code: 'sv-SE', name: 'Svenska', region: 'Sverige' },
  { code: 'th-TH', name: 'ภาษาไทย', region: 'ประเทศไทย' },
  { code: 'tr-TR', name: 'Türkçe', region: 'Türkiye' },
  { code: 'zh-CN', name: '简体中文', region: '中国' },
  { code: 'zh-TW', name: '繁體中文', region: '台灣' },
  { code: 'ar-SA', name: 'العربية', region: 'المملكة العربية السعودية' },
  { code: 'he-IL', name: 'עברית', region: 'ישראל' },
];

export const CURRENCIES: Currency[] = [
  { code: 'INR', name: 'Indian rupee', symbol: '₹', rate: 1 },
  { code: 'USD', name: 'United States dollar', symbol: '$', rate: 0.012 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.011 },
  { code: 'GBP', name: 'Pound sterling', symbol: '£', rate: 0.0094 },
  { code: 'AUD', name: 'Australian dollar', symbol: '$', rate: 0.018 },
  { code: 'BRL', name: 'Brazilian real', symbol: 'R$', rate: 0.065 },
  { code: 'BGN', name: 'Bulgarian lev', symbol: 'лв.', rate: 0.022 },
  { code: 'CAD', name: 'Canadian dollar', symbol: '$', rate: 0.016 },
  { code: 'CLP', name: 'Chilean peso', symbol: '$', rate: 11.2 },
  { code: 'CNY', name: 'Chinese yuan', symbol: '¥', rate: 0.085 },
  { code: 'COP', name: 'Colombian peso', symbol: '$', rate: 47.0 },
  { code: 'CRC', name: 'Costa Rican colon', symbol: '₡', rate: 6.2 },
  { code: 'CZK', name: 'Czech koruna', symbol: 'Kč', rate: 0.27 },
  { code: 'DKK', name: 'Danish krone', symbol: 'kr', rate: 0.082 },
  { code: 'EGP', name: 'Egyptian pound', symbol: 'ج.م', rate: 0.58 },
  { code: 'AED', name: 'Emirati dirham', symbol: 'د.إ', rate: 0.044 },
  { code: 'GHS', name: 'Ghanaian cedi', symbol: 'GH₵', rate: 0.18 },
  { code: 'HKD', name: 'Hong Kong dollar', symbol: '$', rate: 0.093 },
  { code: 'HUF', name: 'Hungarian forint', symbol: 'Ft', rate: 4.3 },
  { code: 'IDR', name: 'Indonesian rupiah', symbol: 'Rp', rate: 190.0 },
  { code: 'ILS', name: 'Israeli new shekel', symbol: '₪', rate: 0.044 },
  { code: 'JPY', name: 'Japanese yen', symbol: '¥', rate: 1.77 },
  { code: 'KZT', name: 'Kazakhstani tenge', symbol: '₸', rate: 5.7 },
  { code: 'KES', name: 'Kenyan shilling', symbol: 'KSh', rate: 1.55 },
  { code: 'MYR', name: 'Malaysian ringgit', symbol: 'RM', rate: 0.053 },
  { code: 'MXN', name: 'Mexican peso', symbol: '$', rate: 0.23 },
  { code: 'MAD', name: 'Moroccan dirham', symbol: 'MAD', rate: 0.12 },
  { code: 'TWD', name: 'New Taiwan dollar', symbol: '$', rate: 0.38 },
  { code: 'NZD', name: 'New Zealand dollar', symbol: '$', rate: 0.020 },
  { code: 'NOK', name: 'Norwegian krone', symbol: 'kr', rate: 0.12 },
  { code: 'PEN', name: 'Peruvian sol', symbol: 'S/', rate: 0.045 },
  { code: 'PHP', name: 'Philippine peso', symbol: '₱', rate: 0.67 },
  { code: 'PLN', name: 'Polish zloty', symbol: 'zł', rate: 0.047 },
  { code: 'QAR', name: 'Qatari riyal', symbol: 'ر.ق', rate: 0.044 },
  { code: 'RON', name: 'Romanian leu', symbol: 'lei', rate: 0.055 },
  { code: 'SAR', name: 'Saudi Arabian riyal', symbol: 'SR', rate: 0.045 },
  { code: 'SGD', name: 'Singapore dollar', symbol: '$', rate: 0.016 },
  { code: 'ZAR', name: 'South African rand', symbol: 'R', rate: 0.22 },
  { code: 'KRW', name: 'South Korean won', symbol: '₩', rate: 16.2 },
  { code: 'SEK', name: 'Swedish krona', symbol: 'kr', rate: 0.12 },
  { code: 'CHF', name: 'Swiss franc', symbol: 'CHF', rate: 0.010 },
  { code: 'THB', name: 'Thai baht', symbol: '฿', rate: 0.42 },
  { code: 'TRY', name: 'Turkish lira', symbol: '₺', rate: 0.41 },
  { code: 'VND', name: 'Vietnamese dong', symbol: '₫', rate: 300.0 },
];

const SUGGESTED_LANGUAGES = ['en-IN', 'en-US', 'en-GB', 'hi-IN', 'kn-IN', 'mr-IN'];
export const getSuggestedLanguages = () => LANGUAGES.filter(l => SUGGESTED_LANGUAGES.includes(l.code));

const defaultFormatPrice = (amountInINR: number | undefined | null) => {
  if (amountInINR == null || isNaN(amountInINR)) return '';
  return `₹${Math.round(amountInINR).toLocaleString()}`;
};

const LocaleContext = createContext<LocaleContextType>({
  language: LANGUAGES[0],
  currency: CURRENCIES[0],
  setLanguage: () => {},
  setCurrency: () => {},
  showLocaleModal: false,
  setShowLocaleModal: () => {},
  localeModalTab: 'language',
  setLocaleModalTab: () => {},
  openModal: () => {},
  formatPrice: defaultFormatPrice,
});

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]);
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]);
  const [showLocaleModal, setShowLocaleModal] = useState(false);
  const [localeModalTab, setLocaleModalTab] = useState<'language' | 'currency'>('language');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('locale_language');
      const savedCurr = localStorage.getItem('locale_currency');
      if (savedLang) setLanguageState(JSON.parse(savedLang));
      if (savedCurr) {
        const parsed: Currency = JSON.parse(savedCurr);
        // Find matching currency from CURRENCIES to keep updated rates/symbols
        const found = CURRENCIES.find(c => c.code === parsed.code) || parsed;
        setCurrencyState(found);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('locale_language', JSON.stringify(lang));
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('locale_currency', JSON.stringify(curr));
  };

  const openModal = (tab: 'language' | 'currency' = 'language') => {
    setLocaleModalTab(tab);
    setShowLocaleModal(true);
  };

  const formatPrice = (amountInINR: number | undefined | null) => {
    if (amountInINR == null || isNaN(amountInINR)) return '';
    const rate = currency.rate ?? 1;
    const converted = Math.round(amountInINR * rate);
    return `${currency.symbol}${converted.toLocaleString()}`;
  };

  return (
    <LocaleContext.Provider value={{
      language, currency, setLanguage, setCurrency,
      showLocaleModal, setShowLocaleModal,
      localeModalTab, setLocaleModalTab,
      openModal, formatPrice,
    }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => useContext(LocaleContext);
