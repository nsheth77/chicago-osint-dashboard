// twilio/functions/notifications-send-sms.js

const { formatCrimeSummary } = require(Runtime.getFunctions()['shared/format-crime-summary'].path);

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();

  // CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, response);
  }

  try {
    // Parse request body (Twilio Functions receive JSON as string)
    const body = typeof event.request === 'string'
      ? JSON.parse(event.request)
      : event;

    const { phoneNumber, crimes, mapSnapshot } = body;

    if (!phoneNumber || !crimes) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'Missing phoneNumber or crimes'
      });
      return callback(null, response);
    }

    const fromNumber = context.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      response.setStatusCode(500);
      response.setBody({
        success: false,
        error: 'Twilio not configured'
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Format crime summary (limited to 50 crimes)
    const messageBody = formatCrimeSummary(crimes, { maxCrimes: 50 });

    // Prepare message options
    const messageOptions = {
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

    // Send SMS
    const message = await client.messages.create(messageOptions);

    console.log('✅ SMS sent successfully:', message.sid);

    response.setBody({
      success: true,
      messageSid: message.sid,
      segmentCount: message.numSegments
        ? parseInt(message.numSegments)
        : undefined,
    });

    return callback(null, response);
  } catch (error) {
    console.error('Send SMS error:', error);

    response.setStatusCode(400);
    response.setBody({
      success: false,
      error: error.message || 'Failed to send SMS. Please try again.'
    });

    return callback(null, response);
  }
};
