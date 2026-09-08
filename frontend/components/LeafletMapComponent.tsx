'use client';

import React, { useEffect, useState } from 'react';
import { ListingItem } from '@/lib/categoriesData';

interface LeafletMapProps {
  items: ListingItem[];
  hoveredItemId: number | null;
  setHoveredItemId: (id: number | null) => void;
  formatItemPriceText: (txt: string) => string;
  onSelectListing: (id: number) => void;
}

// Fixed Leaflet map center coordinates for Noida & nearby properties
const NOIDA_CENTER: [number, number] = [28.5355, 77.3910];

const PROPERTY_COORDS: Record<number, [number, number]> = {
  101: [28.6280, 77.3769], // Sector 63
  102: [28.5630, 77.3395], // Sector 44
  103: [28.5700, 77.3800], // Sector 75
  104: [28.5355, 77.3910], // Central Noida
  105: [28.5800, 77.3200], // Sector 18
  106: [28.5000, 77.4000], // Greater Noida Link
  107: [28.6100, 77.3500], // Sector 62
  108: [28.5500, 77.3600], // Sector 50
};

export default function LeafletMapComponent({
  items,
  hoveredItemId,
  setHoveredItemId,
  formatItemPriceText,
  onSelectListing
}: LeafletMapProps) {
  const [L, setL] = useState<any>(null);
  const mapRef = React.useRef<any>(null);
  const markersRef = React.useRef<Record<number, any>>({});

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  useEffect(() => {
    if (!L) return;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, [L]);

  // Initialize Map Once
  useEffect(() => {
    if (!L) return;

    const mapContainer = document.getElementById('leaflet-map-root');
    if (!mapContainer || mapRef.current) return;

    if ((mapContainer as any)._leaflet_id) return;

    const map = L.map('leaflet-map-root', {
      center: NOIDA_CENTER,
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [L]);

  // Update Markers dynamically whenever items or hoveredItemId changes
  useEffect(() => {
    if (!L || !mapRef.current) return;
    const map = mapRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    items.forEach((item, index) => {
      const coords = PROPERTY_COORDS[item.id] || [
        NOIDA_CENTER[0] + (index % 4 === 0 ? 0.02 : index % 3 === 0 ? -0.02 : 0.01) * (index % 2 === 0 ? 1 : -1),
        NOIDA_CENTER[1] + (index % 2 === 0 ? 0.03 : -0.03) * (index % 3 === 0 ? 1 : -1)
      ];

      const cleanPrice = formatItemPriceText(item.priceText).split(' ')[0];
      const isHovered = hoveredItemId === item.id;

      const htmlContent = `
        <div style="
          background-color: ${isHovered ? '#222222' : '#ffffff'};
          color: ${isHovered ? '#ffffff' : '#222222'};
          padding: 6px 12px;
          border-radius: 28px;
          font-weight: 800;
          font-size: 13px;
          font-family: system-ui, -apple-system, sans-serif;
          box-shadow: ${isHovered ? '0 8px 20px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.18)'};
          border: 1px solid ${isHovered ? '#000000' : 'rgba(0,0,0,0.12)'};
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
          transform: ${isHovered ? 'scale(1.15) translateY(-2px)' : 'scale(1.0)'};
          letter-spacing: -0.01em;
          z-index: ${isHovered ? 999 : 1};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${cleanPrice}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'airbnb-price-marker',
        html: htmlContent,
        iconSize: [64, 32],
        iconAnchor: [32, 16]
      });

      const marker = L.marker(coords, { icon: customIcon, zIndexOffset: isHovered ? 1000 : 0 }).addTo(map);

      marker.on('click', () => onSelectListing(item.id));
      marker.on('mouseover', () => setHoveredItemId(item.id));
      marker.on('mouseout', () => setHoveredItemId(null));

      markersRef.current[item.id] = marker;
    });
  }, [L, items, hoveredItemId]);

  return (
    <div className="w-full h-full relative">
      <div id="leaflet-map-root" className="w-full h-full bg-[#e5e3df]" />
    </div>
  );
}
