import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import type { SendSmsRequest, SendSmsResponse } from '@/types/sms';
import { formatCrimeSummary } from '@/lib/utils/format-crime-summary';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, crimes }: SendSmsRequest = await request.json();

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

    // Send SMS
    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: phoneNumber,
    });

    const response: SendSmsResponse = {
      success: true,
      messageSid: message.sid,
      segmentCount: message.numSegments
        ? parseInt(message.numSegments)
        : undefined,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Send SMS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 400 }
    );
  }
}
