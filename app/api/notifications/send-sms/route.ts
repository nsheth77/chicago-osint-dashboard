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

    // If map snapshot provided, send as MMS with media
    if (mapSnapshot) {
      console.log('📸 Sending MMS with map screenshot');

      // Twilio accepts base64 data URLs directly in mediaUrl parameter
      // We need to convert to a publicly accessible URL or use Twilio's media upload
      // For simplicity, we'll convert base64 to a Buffer and upload inline

      // Extract base64 data
      const base64Data = mapSnapshot.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Upload to Twilio Media service
      // Note: This requires creating a temporary public URL
      // For production, consider using AWS S3 or similar

      // For now, we'll use a workaround: data URIs (may not work with all carriers)
      // Alternative: Upload to cloud storage first
      messageOptions.mediaUrl = [mapSnapshot]; // Twilio will attempt to fetch this

      console.log('⚠️ Using data URI for MMS - may not work with all carriers');
      console.log('💡 Consider uploading to S3/CloudStorage for production');
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

    console.log(`✅ ${mapSnapshot ? 'MMS' : 'SMS'} sent successfully:`, message.sid);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Send SMS/MMS error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS' },
      { status: 400 }
    );
  }
}
