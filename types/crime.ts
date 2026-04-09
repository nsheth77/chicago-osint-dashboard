// Crime severity levels (S1-S5)
export type SeverityLevel = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

// Raw crime data from Chicago Data Portal API
export interface ChicagoCrimeRaw {
  id: string;
  case_number: string;
  date: string;
  block: string;
  iucr: string;
  primary_type: string;
  description: string;
  location_description: string;
  arrest: boolean;
  domestic: boolean;
  beat: string;
  district: string;
  ward: string;
  community_area: string;
  fbi_code: string;
  x_coordinate?: string;
  y_coordinate?: string;
  year: string;
  updated_on: string;
  latitude?: string;
  longitude?: string;
  location?: {
    latitude: string;
    longitude: string;
    human_address: string;
  };
}

// Enriched crime data with severity classification
export interface Crime {
  id: string;
  caseNumber: string;
  date: Date;
  block: string;
  type: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  arrest: boolean;
  domestic: boolean;
  severity: SeverityLevel;
  color: string;
  district: string;
  ward: string;
}

// Crime statistics for dashboard
export interface CrimeStats {
  total: number;
  s5: number;
  s4: number;
  s3: number;
  s2: number;
  s1: number;
  arrests: number;
  lastUpdated: Date;
}

// Filter state
export interface CrimeFilters {
  severities: SeverityLevel[];
  types: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}
