/**
 * Geocoding utility for converting zip codes to coordinates using Mapbox API
 */

export interface GeocodingResult {
  success: boolean;
  center?: [number, number];
  error?: string;
}

// Chicago bounding box (approximate)
const CHICAGO_BOUNDS = {
  minLat: 41.64,
  maxLat: 42.05,
  minLng: -87.94,
  maxLng: -87.52,
};

/**
 * Validates if coordinates are within Chicago area
 */
function isInChicago(lng: number, lat: number): boolean {
  return (
    lat >= CHICAGO_BOUNDS.minLat &&
    lat <= CHICAGO_BOUNDS.maxLat &&
    lng >= CHICAGO_BOUNDS.minLng &&
    lng <= CHICAGO_BOUNDS.maxLng
  );
}

/**
 * Validates if input is a 5-digit zip code format
 */
function isValidZipFormat(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode);
}

/**
 * Geocodes a zip code using Mapbox Geocoding API
 * @param zipCode - 5-digit zip code to geocode
 * @returns GeocodingResult with success status, center coordinates, or error message
 */
export async function geocodeZipCode(zipCode: string): Promise<GeocodingResult> {
  // Validate format
  if (!isValidZipFormat(zipCode)) {
    return {
      success: false,
      error: 'Please enter a valid 5-digit zip code',
    };
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return {
      success: false,
      error: 'Mapbox token not configured',
    };
  }

  try {
    // Call Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?types=postcode&country=us&access_token=${token}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          error: 'Too many requests. Please try again in a moment.',
        };
      }
      return {
        success: false,
        error: 'Failed to geocode zip code. Please try again.',
      };
    }

    const data = await response.json();

    // Check if we got results
    if (!data.features || data.features.length === 0) {
      return {
        success: false,
        error: 'Zip code not found',
      };
    }

    // Get coordinates from first result
    const [lng, lat] = data.features[0].center;

    // Validate coordinates are in Chicago area
    if (!isInChicago(lng, lat)) {
      return {
        success: false,
        error: 'Zip code is not in the Chicago area',
      };
    }

    return {
      success: true,
      center: [lng, lat],
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: 'Failed to geocode zip code. Please try again.',
    };
  }
}
