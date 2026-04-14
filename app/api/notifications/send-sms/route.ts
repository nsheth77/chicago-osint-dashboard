import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import type { SendSmsRequest, SendSmsResponse } from '@/types/sms';
import { formatCrimeSummary } from '@/lib/utils/format-crime-summary';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, crimes, mapSnapshot }: SendSmsRequest = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { success: false, error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Format crime summary (limited to 50 crimes)
    const messageBody = formatCrimeSummary(crimes, { maxCrimes: 50 });

    // Prepare message options
    const messageOptions: any = {
      body: messageBody,
      from: fromNumber,
      to: phoneNumber,
    };

    // If map snapshot provided, log warning (MMS not supported in MVP)
    if (mapSnapshot) {
      console.warn('⚠️ Map snapshot provided but MMS not supported in MVP');
      console.warn('💡 Falling back to SMS-only (text crime summary)');
      console.warn('📝 For production MMS: Upload to S3/Cloudinary (see docs/mms-implementation-guide.md)');
      console.log('📱 Sending SMS only (map screenshot skipped)');
      // Do NOT set mediaUrl - continue with SMS-only
    } else {
      console.log('📱 Sending SMS only (no map screenshot)');
    }

    // Send SMS or MMS
    const message = await client.messages.create(messageOptions);

    const response: SendSmsResponse = {
      success: true,
      messageSid: message.sid,
      segmentCount: message.numSegments
        ? parseInt(message.numSegments)
        : undefined,
    };

    console.log('✅ SMS sent successfully:', message.sid);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Send SMS error:', error);

    // Provide more detailed error message from Twilio
    const errorMessage = error.message || 'Failed to send SMS. Please try again.';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
