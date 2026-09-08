'use client';

import React from 'react';
import { LoginModal } from './LoginModal';
import { LanguageCurrencyModal } from './LanguageCurrencyModal';

export const GlobalModals: React.FC = () => {
  return (
    <>
      <LoginModal />
      <LanguageCurrencyModal />
    </>
  );
};
