import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import type {
  VerifySendRequest,
  VerifySendResponse,
} from '@/types/sms';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber }: VerifySendRequest = await request.json();

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

    // Send OTP verification code
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    const response: VerifySendResponse = {
      success: true,
      status: verification.status,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Verify send error:', error);
    return NextResponse.json(
      { success: false, status: 'failed', error: 'Failed to send code' },
      { status: 400 }
    );
  }
}
