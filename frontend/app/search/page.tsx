'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { SplitMapSearch } from '@/components/SplitMapSearch';
import { getSectionsForTab, SectionGroup } from '@/lib/categoriesData';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get('section') || 'all-noida';
  const customTitle = searchParams.get('title') || 'Popular homes in Noida';

  // Get all sections across tabs
  const allSections: SectionGroup[] = [
    ...getSectionsForTab('all'),
    ...getSectionsForTab('homes'),
    ...getSectionsForTab('experiences'),
    ...getSectionsForTab('services'),
  ];

  // Find matching section or fallback to first section
  const targetSection =
    allSections.find((s) => s.id === sectionId) ||
    allSections[0] || {
      id: 'noida',
      title: customTitle,
      category: 'homes',
      items: [],
    };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#1A1A1A]">
      <Navbar locationFilter={customTitle} />
      <main className="flex-1">
        <SplitMapSearch section={targetSection} />
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-bold">Loading map search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
