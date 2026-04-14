// twilio/functions/crimes.js

const { fetchChicagoCrimes, isValidCrime } = require(Runtime.getFunctions()['shared/chicago-data'].path);
const { classifySeverity, getSeverityColor } = require(Runtime.getFunctions()['shared/severity'].path);

/**
 * Transforms raw Chicago crime data into enriched Crime objects
 * @param {object} raw - Raw crime record from Chicago API
 * @returns {object|null} Enriched crime object or null if invalid
 */
function transformCrime(raw) {
  if (!isValidCrime(raw)) return null;

  const severity = classifySeverity(raw.primary_type);

  return {
    id: raw.id,
    caseNumber: raw.case_number,
    date: new Date(raw.date).toISOString(),
    block: raw.block,
    type: raw.primary_type,
    description: raw.description,
    location: raw.location_description,
    latitude: parseFloat(raw.latitude),
    longitude: parseFloat(raw.longitude),
    arrest: raw.arrest,
    domestic: raw.domestic,
    severity,
    color: getSeverityColor(severity),
    district: raw.district,
    ward: raw.ward,
  };
}

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();

  // CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, response);
  }

  try {
    // Get query parameters
    const limit = parseInt(event.limit || '1000');
    const daysBack = parseInt(event.days || '7');

    console.log(`Fetching crimes: limit=${limit}, daysBack=${daysBack}`);

    // Fetch from Chicago API
    const rawCrimes = await fetchChicagoCrimes(limit, daysBack);

    // Transform and enrich with severity
    const crimes = rawCrimes
      .map(transformCrime)
      .filter((crime) => crime !== null);

    console.log(`Successfully transformed ${crimes.length} crimes`);

    response.setBody({
      success: true,
      count: crimes.length,
      lastUpdated: new Date().toISOString(),
      data: crimes,
    });

    return callback(null, response);
  } catch (error) {
    console.error('Crimes API error:', error);

    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message || 'Failed to fetch crime data',
      count: 0,
      data: [],
    });

    return callback(null, response);
  }
};
