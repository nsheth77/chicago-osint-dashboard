'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Crime } from '@/types/crime';
import { useSmsNotification } from '@/hooks/useSmsNotification';
import { formatPhoneDisplay } from '@/lib/utils/phone-validation';

interface SmsNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crimes: Crime[];
  mapRef: React.RefObject<mapboxgl.Map | null>;
}

export function SmsNotificationDialog({
  open,
  onOpenChange,
  crimes,
  mapRef,
}: SmsNotificationDialogProps) {
  const {
    step,
    phoneNumber,
    otpCode,
    error,
    loading,
    setPhoneNumber,
    setOtpCode,
    validatePhone,
    verifyOtp,
    reset,
    canProceed,
    attemptsRemaining,
  } = useSmsNotification(crimes, mapRef);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const getStepTitle = () => {
    switch (step) {
      case 'PHONE_INPUT':
      case 'VALIDATING_PHONE':
      case 'PHONE_INVALID':
        return 'Enter Your Phone Number';
      case 'PHONE_VALID':
      case 'SENDING_OTP':
        return 'Validating...';
      case 'OTP_INPUT':
      case 'VERIFYING_OTP':
      case 'OTP_INVALID':
        return 'Enter Verification Code';
      case 'SENDING_SMS':
        return 'Sending SMS...';
      case 'SUCCESS':
        return 'Success!';
      default:
        return 'Text Crime Details';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'PHONE_INPUT':
        return "We'll send you a verification code to confirm your number";
      case 'VALIDATING_PHONE':
        return 'Checking if this is a valid mobile number...';
      case 'PHONE_VALID':
        return 'Valid mobile number detected';
      case 'OTP_INPUT':
        return `Enter the 6-digit code sent to ${formatPhoneDisplay(phoneNumber)}`;
      case 'SUCCESS':
        return 'Crime summary has been sent to your phone';
      default:
        return '';
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'PHONE_INPUT':
        return (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceed && !loading) {
                  validatePhone();
                }
              }}
              aria-invalid={!!error}
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        );

      case 'VALIDATING_PHONE':
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="ml-3 text-sm text-white/70">
              Validating phone number...
            </p>
          </div>
        );

      case 'PHONE_INVALID':
        return (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        );

      case 'PHONE_VALID':
        return (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-400">Valid mobile number</p>
          </div>
        );

      case 'SENDING_OTP':
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="ml-3 text-sm text-white/70">
              Sending verification code...
            </p>
          </div>
        );

      case 'OTP_INPUT':
      case 'OTP_INVALID':
        return (
          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otpCode.length === 6 && !loading) {
                  verifyOtp();
                }
              }}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            <p className="text-xs text-white/50 text-center">
              Enter the 6-digit code sent to {formatPhoneDisplay(phoneNumber)}
            </p>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>
        );

      case 'VERIFYING_OTP':
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="ml-3 text-sm text-white/70">Verifying code...</p>
          </div>
        );

      case 'SENDING_SMS':
        return (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="ml-3 text-sm text-white/70">
              Sending crime summary...
            </p>
          </div>
        );

      case 'SUCCESS':
        return (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-white text-center">
              Crime summary sent to {formatPhoneDisplay(phoneNumber)}
            </p>
            <p className="text-sm text-white/50 text-center">
              {crimes.length > 50
                ? `Top 50 of ${crimes.length} crimes included`
                : `${crimes.length} crime${crimes.length === 1 ? '' : 's'} included`}
            </p>
            <p className="text-xs text-white/40 text-center">
              SMS may take 1-2 minutes to arrive
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepActions = () => {
    switch (step) {
      case 'PHONE_INPUT':
        return (
          <Button
            onClick={validatePhone}
            disabled={!canProceed || loading}
            className="w-full"
          >
            Continue
          </Button>
        );

      case 'PHONE_INVALID':
        return (
          <Button onClick={reset} variant="outline" className="w-full">
            Try Again
          </Button>
        );

      case 'OTP_INPUT':
      case 'OTP_INVALID':
        return (
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={verifyOtp}
              disabled={
                otpCode.length !== 6 || loading || attemptsRemaining === 0
              }
              className="w-full"
            >
              Verify Code
            </Button>
            <Button
              onClick={() => {
                setOtpCode('');
                validatePhone();
              }}
              variant="ghost"
              size="sm"
              disabled={loading}
            >
              Resend Code
            </Button>
          </div>
        );

      case 'SUCCESS':
        return (
          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {renderStepContent()}

        {renderStepActions() && <DialogFooter>{renderStepActions()}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
