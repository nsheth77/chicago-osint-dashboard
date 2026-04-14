export const SMS_ERROR_MESSAGES = {
  INVALID_PHONE: 'Please enter a valid US phone number (10 digits)',
  LANDLINE_DETECTED:
    'SMS can only be sent to mobile numbers. Landlines are not supported.',
  OTP_INVALID: 'Invalid verification code. Please check and try again.',
  OTP_EXPIRED: 'Verification code expired. Please request a new code.',
  OTP_MAX_ATTEMPTS:
    'Maximum verification attempts exceeded. Please try again later.',
  TWILIO_ERROR: 'Unable to send SMS. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};
