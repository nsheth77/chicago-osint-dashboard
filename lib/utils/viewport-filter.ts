import { Crime } from '@/types/crime';
import type { LngLatBounds } from 'mapbox-gl';

/**
 * Filters crimes to only those within the given map viewport bounds
 */
export function filterCrimesByViewport(
  crimes: Crime[],
  bounds: LngLatBounds | null
): Crime[] {
  if (!bounds) {
    return crimes;
  }

  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return crimes.filter((crime) => {
    const { latitude, longitude } = crime;

    // Check if crime coordinates are within bounds
    return (
      longitude >= sw.lng &&
      longitude <= ne.lng &&
      latitude >= sw.lat &&
      latitude <= ne.lat
    );
  });
}

/**
 * Gets current viewport bounds from a Mapbox map instance
 */
export function getMapBounds(map: mapboxgl.Map | null): LngLatBounds | null {
  if (!map) return null;
  return map.getBounds();
}
