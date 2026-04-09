import { SeverityLevel } from '@/types/crime';

// Crime type to severity mapping
const SEVERITY_MAP: Record<string, SeverityLevel> = {
  // S5 - Critical (Red)
  'HOMICIDE': 'S5',
  'CRIM SEXUAL ASSAULT': 'S5',
  'CRIMINAL SEXUAL ASSAULT': 'S5',
  'KIDNAPPING': 'S5',

  // S4 - High (Orange)
  'ROBBERY': 'S4',
  'AGGRAVATED ASSAULT': 'S4',
  'AGGRAVATED BATTERY': 'S4',
  'ASSAULT': 'S4',

  // S3 - Medium (Yellow)
  'BURGLARY': 'S3',
  'MOTOR VEHICLE THEFT': 'S3',
  'ARSON': 'S3',

  // S2 - Low (Blue)
  'THEFT': 'S2',
  'BATTERY': 'S2',
  'CRIMINAL DAMAGE': 'S2',
  'CRIMINAL TRESPASS': 'S2',

  // S1 - Very Low (Gray)
  'NARCOTICS': 'S1',
  'DECEPTIVE PRACTICE': 'S1',
  'OTHER OFFENSE': 'S1',
  'PUBLIC PEACE VIOLATION': 'S1',
  'INTERFERENCE WITH PUBLIC OFFICER': 'S1',
};

// Severity colors for map markers
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  S5: '#ef4444', // red-500
  S4: '#f97316', // orange-500
  S3: '#eab308', // yellow-500
  S2: '#3b82f6', // blue-500
  S1: '#6b7280', // gray-500
};

// Severity labels for UI
export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  S5: 'Critical',
  S4: 'High',
  S3: 'Medium',
  S2: 'Low',
  S1: 'Very Low',
};

/**
 * Classifies a crime type into a severity level (S1-S5)
 * @param crimeType - The primary crime type from Chicago API
 * @returns Severity level (defaults to S2 for unknown types)
 */
export function classifySeverity(crimeType: string): SeverityLevel {
  const normalized = crimeType.toUpperCase().trim();
  return SEVERITY_MAP[normalized] || 'S2'; // Default to medium if unknown
}

/**
 * Gets the color for a severity level
 * @param severity - The severity level
 * @returns Hex color code
 */
export function getSeverityColor(severity: SeverityLevel): string {
  return SEVERITY_COLORS[severity];
}

/**
 * Gets the label for a severity level
 * @param severity - The severity level
 * @returns Human-readable label
 */
export function getSeverityLabel(severity: SeverityLevel): string {
  return SEVERITY_LABELS[severity];
}

/**
 * Gets all severity levels ordered from highest to lowest
 */
export function getAllSeverities(): SeverityLevel[] {
  return ['S5', 'S4', 'S3', 'S2', 'S1'];
}
