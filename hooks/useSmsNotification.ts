import { useState, useCallback } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Crime } from '@/types/crime';
import { SmsStep } from '@/types/sms';
import { formatPhoneNumber } from '@/lib/utils/phone-validation';
import { SMS_ERROR_MESSAGES } from '@/lib/utils/sms-error-messages';
import { captureMapScreenshot, isMapReadyForScreenshot } from '@/lib/utils/map-screenshot';

export function useSmsNotification(
  crimes: Crime[],
  mapRef: React.RefObject<mapboxgl.Map | null>
) {
  const [step, setStep] = useState<SmsStep>('PHONE_INPUT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);

  const MAX_OTP_ATTEMPTS = 3;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

  const reset = useCallback(() => {
    setStep('PHONE_INPUT');
    setPhoneNumber('');
    setOtpCode('');
    setError(null);
    setLoading(false);
    setOtpAttempts(0);
  }, []);

  const validatePhone = useCallback(async () => {
    setStep('VALIDATING_PHONE');
    setError(null);
    setLoading(true);

    try {
      const formatted = formatPhoneNumber(phoneNumber);
      if (!formatted) {
        setError(SMS_ERROR_MESSAGES.INVALID_PHONE);
        setStep('PHONE_INVALID');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/notifications-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formatted }),
      });

      const data = await response.json();

      if (!data.success || !data.valid) {
        setError(SMS_ERROR_MESSAGES.INVALID_PHONE);
        setStep('PHONE_INVALID');
        setLoading(false);
        return;
      }

      if (!data.isMobile) {
        setError(SMS_ERROR_MESSAGES.LANDLINE_DETECTED);
        setStep('PHONE_INVALID');
        setLoading(false);
        return;
      }

      // Success - phone is valid mobile
      setPhoneNumber(formatted);
      setStep('PHONE_VALID');
      setLoading(false);

      // Auto-advance to sending OTP after 1 second
      setTimeout(() => sendOtp(formatted), 1000);
    } catch (err) {
      setError(SMS_ERROR_MESSAGES.NETWORK_ERROR);
      setStep('PHONE_INVALID');
      setLoading(false);
    }
  }, [phoneNumber]);

  const sendOtp = useCallback(
    async (phone?: string) => {
      const targetPhone = phone || phoneNumber;
      setStep('SENDING_OTP');
      setError(null);
      setLoading(true);

      try {
        const response = await fetch(`${API_BASE}/notifications-verify-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: targetPhone }),
        });

        const data = await response.json();

        if (!data.success) {
          setError(SMS_ERROR_MESSAGES.TWILIO_ERROR);
          setStep('PHONE_INVALID');
          setLoading(false);
          return;
        }

        // OTP sent successfully
        setStep('OTP_INPUT');
        setLoading(false);
        setOtpAttempts(0);
      } catch (err) {
        setError(SMS_ERROR_MESSAGES.NETWORK_ERROR);
        setStep('PHONE_INVALID');
        setLoading(false);
      }
    },
    [phoneNumber]
  );

  const verifyOtp = useCallback(async () => {
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
      setError(SMS_ERROR_MESSAGES.OTP_MAX_ATTEMPTS);
      return;
    }

    setStep('VERIFYING_OTP');
    setError(null);
    setLoading(true);
    setOtpAttempts(otpAttempts + 1);

    try {
      const response = await fetch(`${API_BASE}/notifications-verify-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otpCode }),
      });

      const data = await response.json();

      if (!data.success || !data.valid) {
        const remaining = MAX_OTP_ATTEMPTS - otpAttempts;
        setError(
          remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`
            : SMS_ERROR_MESSAGES.OTP_MAX_ATTEMPTS
        );
        setStep('OTP_INVALID');
        setLoading(false);
        return;
      }

      // OTP verified - now send SMS
      setLoading(false);
      await sendSms();
    } catch (err) {
      setError(SMS_ERROR_MESSAGES.NETWORK_ERROR);
      setStep('OTP_INVALID');
      setLoading(false);
    }
  }, [phoneNumber, otpCode, otpAttempts]);

  const sendSms = useCallback(async () => {
    setStep('SENDING_SMS');
    setError(null);
    setLoading(true);

    try {
      // Capture map screenshot
      let mapSnapshot: string | null = null;

      if (mapRef.current && isMapReadyForScreenshot(mapRef.current)) {
        mapSnapshot = captureMapScreenshot(mapRef.current);

        if (!mapSnapshot) {
          console.warn('Failed to capture map screenshot, sending without image');
        } else {
          console.log('✅ Map screenshot captured for MMS');
        }
      } else {
        console.warn('Map not ready for screenshot, sending SMS only');
      }

      const response = await fetch(`${API_BASE}/notifications-send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          crimes,
          mapSnapshot, // Include screenshot data
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(SMS_ERROR_MESSAGES.TWILIO_ERROR);
        setStep('PHONE_INVALID');
        setLoading(false);
        return;
      }

      // SMS/MMS sent successfully
      setStep('SUCCESS');
      setLoading(false);
    } catch (err) {
      setError(SMS_ERROR_MESSAGES.NETWORK_ERROR);
      setStep('PHONE_INVALID');
      setLoading(false);
    }
  }, [phoneNumber, crimes, mapRef]);

  return {
    step,
    phoneNumber,
    otpCode,
    error,
    loading,
    setPhoneNumber,
    setOtpCode,
    validatePhone,
    sendOtp,
    verifyOtp,
    sendSms,
    reset,
    canProceed: phoneNumber.length >= 10,
    attemptsRemaining: MAX_OTP_ATTEMPTS - otpAttempts,
  };
}
