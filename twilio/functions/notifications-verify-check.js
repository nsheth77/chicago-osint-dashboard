// twilio/functions/notifications-verify-check.js

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

    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      response.setStatusCode(400);
      response.setBody({
        success: false,
        error: 'Missing phoneNumber or code'
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

    // Check OTP verification code
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    const valid = verificationCheck.status === 'approved';

    console.log('✅ Verification check:', verificationCheck.status);

    response.setBody({
      success: valid,
      status: verificationCheck.status,
      valid,
    });

    return callback(null, response);
  } catch (error) {
    console.error('Verify check error:', error);

    response.setStatusCode(400);
    response.setBody({
      success: false,
      status: 'failed',
      valid: false,
      error: 'Invalid verification code',
    });

    return callback(null, response);
  }
};
