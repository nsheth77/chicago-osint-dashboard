import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import type {
  VerifyCheckRequest,
  VerifyCheckResponse,
} from '@/types/sms';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code }: VerifyCheckRequest = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifySid) {
      return NextResponse.json(
        { success: false, error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Check OTP verification code
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    const valid = verificationCheck.status === 'approved';

    const response: VerifyCheckResponse = {
      success: valid,
      status: verificationCheck.status,
      valid,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Verify check error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        valid: false,
        error: 'Invalid verification code',
      },
      { status: 400 }
    );
  }
}
