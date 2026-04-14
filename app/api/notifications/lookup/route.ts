import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import type {
  PhoneLookupRequest,
  PhoneLookupResponse,
} from '@/types/sms';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber }: PhoneLookupRequest = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { success: false, error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Lookup phone number with line type intelligence
    const lookup = await client.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch({ fields: 'line_type_intelligence' });

    const lineType = lookup.lineTypeIntelligence?.type || 'unknown';
    const isMobile = lineType === 'mobile';

    const response: PhoneLookupResponse = {
      success: true,
      valid: true,
      isMobile,
      carrier: lookup.lineTypeIntelligence?.carrierName,
      lineType,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Lookup error:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        isMobile: false,
        error: 'Invalid phone number',
      },
      { status: 400 }
    );
  }
}
