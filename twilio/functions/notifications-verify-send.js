// twilio/functions/notifications-verify-send.js

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
    // Parse request body
    const body = typeof event.request === 'string'
      ? JSON.parse(event.request)
      : event;

    const { phoneNumber } = body;

    if (!phoneNumber) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'Missing phoneNumber'
      });
      return callback(null, response);
    }

    const verifySid = context.TWILIO_VERIFY_SERVICE_SID;

    if (!verifySid) {
      response.setStatusCode(500);
      response.setBody({
        success: false,
        error: 'Twilio Verify not configured'
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Send OTP verification code
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    console.log('✅ Verification sent:', verification.status);

    response.setBody({
      success: true,
      status: verification.status,
    });

    return callback(null, response);
  } catch (error) {
    console.error('Verify send error:', error);

    response.setStatusCode(400);
    response.setBody({
      success: false,
      status: 'failed',
      error: 'Failed to send code'
    });

    return callback(null, response);
  }
};
