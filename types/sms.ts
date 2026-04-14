import { Crime } from './crime';

export type SmsStep =
  | 'PHONE_INPUT'
  | 'VALIDATING_PHONE'
  | 'PHONE_INVALID'
  | 'PHONE_VALID'
  | 'SENDING_OTP'
  | 'OTP_INPUT'
  | 'VERIFYING_OTP'
  | 'OTP_INVALID'
  | 'SENDING_SMS'
  | 'SUCCESS';

export interface PhoneLookupRequest {
  phoneNumber: string;
}

export interface PhoneLookupResponse {
  success: boolean;
  valid: boolean;
  isMobile: boolean;
  carrier?: string;
  lineType?: string;
  error?: string;
}

export interface VerifySendRequest {
  phoneNumber: string;
}

export interface VerifySendResponse {
  success: boolean;
  status: string;
  error?: string;
}

export interface VerifyCheckRequest {
  phoneNumber: string;
  code: string;
}

export interface VerifyCheckResponse {
  success: boolean;
  status: string;
  valid: boolean;
  error?: string;
}

export interface SendSmsRequest {
  phoneNumber: string;
  crimes: Crime[];
  mapSnapshot?: string; // Optional base64 PNG data URL
}

export interface SendSmsResponse {
  success: boolean;
  messageSid?: string;
  segmentCount?: number;
  error?: string;
}
