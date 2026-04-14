import { Crime, SeverityLevel } from '@/types/crime';
import { SEVERITY_LABELS } from './severity';

export interface CrimeSummaryOptions {
  maxCrimes?: number;
  maxTypes?: number;
}

/**
 * Formats crimes into SMS-friendly text summary
 */
export function formatCrimeSummary(
  crimes: Crime[],
  options: CrimeSummaryOptions = {}
): string {
  const { maxCrimes = 50, maxTypes = 5 } = options;

  const originalCount = crimes.length;

  // Sort by severity (S5 > S4 > S3 > S2 > S1)
  const severityOrder = { S5: 5, S4: 4, S3: 3, S2: 2, S1: 1 };
  const sortedCrimes = [...crimes].sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
  );

  // Limit to max crimes
  const limitedCrimes = sortedCrimes.slice(0, maxCrimes);
  const isLimited = originalCount > maxCrimes;

  // Calculate severity distribution
  const severityCount: Record<SeverityLevel, number> = {
    S5: 0,
    S4: 0,
    S3: 0,
    S2: 0,
    S1: 0,
  };

  limitedCrimes.forEach((crime) => {
    severityCount[crime.severity]++;
  });

  // Calculate top crime types
  const typeCount = new Map<string, number>();
  limitedCrimes.forEach((crime) => {
    typeCount.set(crime.type, (typeCount.get(crime.type) || 0) + 1);
  });

  const topTypes = Array.from(typeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTypes)
    .map(([type, count]) => `${type} (${count})`);

  // Build SMS message
  let message = `Chicago Crime Alert\n\n`;

  if (isLimited) {
    message += `Top ${maxCrimes} of ${originalCount.toLocaleString()} crimes:\n\n`;
  } else {
    message += `${originalCount.toLocaleString()} crimes displayed:\n\n`;
  }

  message += `Severity:\n`;
  if (severityCount.S5 > 0)
    message += `• ${severityCount.S5} Critical (S5)\n`;
  if (severityCount.S4 > 0) message += `• ${severityCount.S4} High (S4)\n`;
  if (severityCount.S3 > 0) message += `• ${severityCount.S3} Medium (S3)\n`;
  if (severityCount.S2 > 0) message += `• ${severityCount.S2} Low (S2)\n`;
  if (severityCount.S1 > 0)
    message += `• ${severityCount.S1} Very Low (S1)\n`;

  message += `\nTop Types:\n`;
  topTypes.forEach((type) => {
    message += `• ${type}\n`;
  });

  const now = new Date();
  message += `\nData as of ${now.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  return message;
}
