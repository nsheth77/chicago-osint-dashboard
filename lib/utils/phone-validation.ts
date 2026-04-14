/**
 * Formats phone number to E.164 format (+1XXXXXXXXXX)
 */
export function formatPhoneNumber(input: string): string | null {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return null; // Invalid format
}

/**
 * Validates E.164 phone number format
 */
export function isValidPhoneFormat(phone: string): boolean {
  return /^\+1\d{10}$/.test(phone);
}

/**
 * Formats phone for display: +12345678901 -> (234) 567-8901
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${areaCode}) ${prefix}-${line}`;
  }
  return phone;
}
