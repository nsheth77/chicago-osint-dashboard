// twilio/functions/shared/chicago-data.js

const fetch = require('node-fetch');

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
 * @param {number} limit - Maximum number of records to fetch
 * @param {number} daysBack - Number of days to look back
 * @returns {Promise<Array>} Array of crime records
 */
async function fetchChicagoCrimes(limit = 1000, daysBack = 7) {
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

    const data = await response.json();

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
 * @param {object} crime - Raw crime record
 * @returns {boolean}
 */
function isValidCrime(crime) {
  return !!(
    crime.id &&
    crime.date &&
    crime.primary_type &&
    crime.latitude &&
    crime.longitude
  );
}

module.exports = {
  fetchChicagoCrimes,
  isValidCrime,
  CHICAGO_BOUNDS,
};
