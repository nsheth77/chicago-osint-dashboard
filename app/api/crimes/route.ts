import { NextRequest, NextResponse } from 'next/server';
import { fetchChicagoCrimes, isValidCrime } from '@/lib/api/chicago-data';
import { classifySeverity, getSeverityColor } from '@/lib/utils/severity';
import { Crime, ChicagoCrimeRaw } from '@/types/crime';

// Cache configuration (5 minutes)
export const revalidate = 300;

/**
 * Transforms raw Chicago crime data into enriched Crime objects
 */
function transformCrime(raw: ChicagoCrimeRaw): Crime | null {
  if (!isValidCrime(raw)) return null;

  const severity = classifySeverity(raw.primary_type);

  return {
    id: raw.id,
    caseNumber: raw.case_number,
    date: new Date(raw.date),
    block: raw.block,
    type: raw.primary_type,
    description: raw.description,
    location: raw.location_description,
    latitude: parseFloat(raw.latitude!),
    longitude: parseFloat(raw.longitude!),
    arrest: raw.arrest,
    domestic: raw.domestic,
    severity,
    color: getSeverityColor(severity),
    district: raw.district,
    ward: raw.ward,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '1000');
    const daysBack = parseInt(searchParams.get('days') || '7');

    // Fetch from Chicago API
    const rawCrimes = await fetchChicagoCrimes(limit, daysBack);

    // Transform and enrich with severity
    const crimes: Crime[] = rawCrimes
      .map(transformCrime)
      .filter((crime): crime is Crime => crime !== null);

    return NextResponse.json({
      success: true,
      count: crimes.length,
      lastUpdated: new Date().toISOString(),
      data: crimes,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch crime data',
      count: 0,
      data: [],
    }, {
      status: 500,
    });
  }
}
