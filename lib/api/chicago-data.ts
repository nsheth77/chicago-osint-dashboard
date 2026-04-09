import { ChicagoCrimeRaw } from '@/types/crime';

const CHICAGO_API_BASE = 'https://data.cityofchicago.org/resource/ijzp-q8t2.json';

// Chicago city bounds (approximate)
const CHICAGO_BOUNDS = {
  north: 42.05,
  south: 41.64,
  east: -87.52,
  west: -87.95,
};

/**
 * Fetches recent crime data from Chicago Data Portal
 * @param limit - Maximum number of records to fetch
 * @param daysBack - Number of days to look back
 * @returns Array of crime records
 */
export async function fetchChicagoCrimes(
  limit: number = 1000,
  daysBack: number = 7
): Promise<ChicagoCrimeRaw[]> {
  try {
    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);
    const dateString = dateThreshold.toISOString().split('T')[0];

    // Build SoQL query
    const params = new URLSearchParams({
      $limit: limit.toString(),
      $order: 'date DESC',
      $where: `date > '${dateString}T00:00:00'`,
    });

    const url = `${CHICAGO_API_BASE}?${params}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chicago API error: ${response.status} ${response.statusText}`);
    }

    const data: ChicagoCrimeRaw[] = await response.json();

    // Filter out records without coordinates and outside Chicago bounds
    const filtered = data.filter((crime) => {
      if (!crime.latitude || !crime.longitude) return false;

      const lat = parseFloat(crime.latitude);
      const lng = parseFloat(crime.longitude);

      // Check if coordinates are valid and within Chicago bounds
      if (isNaN(lat) || isNaN(lng)) return false;

      return (
        lat >= CHICAGO_BOUNDS.south &&
        lat <= CHICAGO_BOUNDS.north &&
        lng >= CHICAGO_BOUNDS.west &&
        lng <= CHICAGO_BOUNDS.east
      );
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching Chicago crime data:', error);
    throw error;
  }
}

/**
 * Validates crime data has required fields
 */
export function isValidCrime(crime: ChicagoCrimeRaw): boolean {
  return !!(
    crime.id &&
    crime.date &&
    crime.primary_type &&
    crime.latitude &&
    crime.longitude
  );
}
