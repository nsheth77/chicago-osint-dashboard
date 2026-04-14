'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { Crime } from '@/types/crime';
import { useCrimeStore } from '@/lib/store/crime-store';
import { ZipCodeInput } from './ZipCodeInput';
import { SmsNotificationButton } from '@/components/notifications/SmsNotificationButton';

interface CrimeMapProps {
  crimes: Crime[];
}

// Chicago coordinates
const CHICAGO_CENTER: [number, number] = [-87.6298, 41.8781];
const DEFAULT_ZOOM = 11;

export function CrimeMap({ crimes }: CrimeMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const { setSelectedCrime, selectedSeverities, selectedTypes } = useCrimeStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [markerCount, setMarkerCount] = useState(0);

  console.log('🗺️ CrimeMap received crimes:', crimes.length, 'mapLoaded:', mapLoaded);

  // Filter crimes based on selected filters (computed once for use in markers and SMS)
  const filteredCrimes = useMemo(() => {
    return crimes.filter((crime) => {
      if (selectedSeverities.length > 0 && !selectedSeverities.includes(crime.severity)) {
        return false;
      }
      if (selectedTypes.length > 0 && !selectedTypes.includes(crime.type)) {
        return false;
      }
      return true;
    });
  }, [crimes, selectedSeverities, selectedTypes]);

  // Handle zoom to location from zip code search
  const handleZoomToLocation = (center: [number, number]) => {
    if (!map.current) return;

    map.current.flyTo({
      center,
      zoom: 13,
      duration: 1500,
      essential: true,
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) {
      console.log('⚠️ Map container not ready yet');
      return;
    }

    if (map.current) {
      console.log('⚠️ Map already initialized');
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    console.log('🔑 Mapbox token:', token ? `${token.substring(0, 20)}...` : 'MISSING!');

    if (!token) {
      console.error('❌ NEXT_PUBLIC_MAPBOX_TOKEN is missing!');
      return;
    }

    // Check container dimensions
    const rect = mapContainer.current.getBoundingClientRect();
    console.log('📏 Map container dimensions:', {
      width: rect.width,
      height: rect.height,
      exists: !!mapContainer.current
    });

    if (rect.width === 0 || rect.height === 0) {
      console.error('❌ Map container has zero dimensions! width:', rect.width, 'height:', rect.height);
      return;
    }

    mapboxgl.accessToken = token;

    console.log('🚀 Initializing Mapbox map...');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: CHICAGO_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 10,
        maxZoom: 18,
      });

      console.log('✅ Mapbox Map object created');
    } catch (error) {
      console.error('❌ Error creating Mapbox map:', error);
      return;
    }

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      console.log('✅ Mapbox map loaded successfully!');
      setMapLoaded(true);
    });

    map.current.on('error', (e) => {
      console.error('❌ Mapbox error:', e);
    });

    console.log('🗺️ Mapbox map initialized, waiting for load...');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when crimes or filters change
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.log('⏸️ Skipping marker update - map not ready. mapLoaded:', mapLoaded);
      return;
    }

    console.log('🎯 Updating markers for', crimes.length, 'crimes');

    // Remove existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    console.log('🔍 Filtered crimes:', filteredCrimes.length, 'of', crimes.length);

    // Add new markers
    filteredCrimes.forEach((crime) => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'crime-marker';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = crime.color;
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: ${crime.color};">
            ${crime.type}
          </div>
          <div style="font-size: 12px; color: #888; margin-bottom: 4px;">
            ${crime.severity} - ${crime.description}
          </div>
          <div style="font-size: 11px; color: #666;">
            ${crime.block}
          </div>
          <div style="font-size: 11px; color: #666;">
            ${new Date(crime.date).toLocaleString()}
          </div>
        </div>
      `);

      // Create marker with popup
      const marker = new mapboxgl.Marker(el)
        .setLngLat([crime.longitude, crime.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Show popup on hover
      el.addEventListener('mouseenter', () => {
        marker.togglePopup();
      });

      el.addEventListener('mouseleave', () => {
        marker.togglePopup();
      });

      el.addEventListener('click', () => {
        setSelectedCrime(crime);
      });

      markers.current.push(marker);
    });

    setMarkerCount(markers.current.length);
    console.log('✅ Added', markers.current.length, 'markers to the map');
  }, [filteredCrimes, mapLoaded, setSelectedCrime]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '600px' }}>
      <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Crime count overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-white/10 z-10">
        <div className="text-sm font-medium">
          {markerCount.toLocaleString()} crimes displayed
        </div>
      </div>

      {/* SMS Notification Button - positioned below crime count */}
      {mapLoaded && (
        <SmsNotificationButton
          filteredCrimes={filteredCrimes}
          disabled={!mapLoaded || filteredCrimes.length === 0}
        />
      )}

      {/* Zip code search - only show after map is loaded */}
      {mapLoaded && <ZipCodeInput onZoomToLocation={handleZoomToLocation} />}
    </div>
  );
}
