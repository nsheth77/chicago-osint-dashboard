// twilio/functions/shared/format-crime-summary.js

/**
 * Formats crimes into SMS-friendly text summary
 * @param {Array} crimes - Array of enriched crime objects
 * @param {object} options - Formatting options
 * @param {number} options.maxCrimes - Max crimes to include (default 50)
 * @param {number} options.maxTypes - Max crime types to show (default 5)
 * @returns {string} Formatted SMS message
 */
function formatCrimeSummary(crimes, options = {}) {
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
  const severityCount = {
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
  const typeCount = new Map();
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

module.exports = {
  formatCrimeSummary,
};
