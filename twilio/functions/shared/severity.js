// twilio/functions/shared/severity.js

/**
 * @typedef {'S1' | 'S2' | 'S3' | 'S4' | 'S5'} SeverityLevel
 */

// Crime type to severity mapping
const SEVERITY_MAP = {
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
const SEVERITY_COLORS = {
  S5: '#ef4444', // red-500
  S4: '#f97316', // orange-500
  S3: '#eab308', // yellow-500
  S2: '#3b82f6', // blue-500
  S1: '#6b7280', // gray-500
};

// Severity labels for UI
const SEVERITY_LABELS = {
  S5: 'Critical',
  S4: 'High',
  S3: 'Medium',
  S2: 'Low',
  S1: 'Very Low',
};

/**
 * Classifies a crime type into a severity level (S1-S5)
 * @param {string} crimeType - The primary crime type from Chicago API
 * @returns {SeverityLevel} Severity level (defaults to S2 for unknown types)
 */
function classifySeverity(crimeType) {
  const normalized = crimeType.toUpperCase().trim();
  return SEVERITY_MAP[normalized] || 'S2'; // Default to medium if unknown
}

/**
 * Gets the color for a severity level
 * @param {SeverityLevel} severity - The severity level
 * @returns {string} Hex color code
 */
function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity];
}

/**
 * Gets the label for a severity level
 * @param {SeverityLevel} severity - The severity level
 * @returns {string} Human-readable label
 */
function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity];
}

/**
 * Gets all severity levels ordered from highest to lowest
 * @returns {SeverityLevel[]}
 */
function getAllSeverities() {
  return ['S5', 'S4', 'S3', 'S2', 'S1'];
}

module.exports = {
  classifySeverity,
  getSeverityColor,
  getSeverityLabel,
  getAllSeverities,
  SEVERITY_MAP,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
};
