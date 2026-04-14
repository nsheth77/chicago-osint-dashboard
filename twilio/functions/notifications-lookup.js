// twilio/functions/notifications-lookup.js

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

    const client = context.getTwilioClient();

    // Lookup phone number with line type intelligence
    const lookup = await client.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch({ fields: 'line_type_intelligence' });

    const lineType = lookup.lineTypeIntelligence?.type || 'unknown';
    const isMobile = lineType === 'mobile';

    console.log('✅ Lookup success:', phoneNumber, lineType);

    response.setBody({
      success: true,
      valid: true,
      isMobile,
      carrier: lookup.lineTypeIntelligence?.carrierName,
      lineType,
    });

    return callback(null, response);
  } catch (error) {
    console.error('Lookup error:', error);

    response.setStatusCode(400);
    response.setBody({
      success: false,
      valid: false,
      isMobile: false,
      error: 'Invalid phone number',
    });

    return callback(null, response);
  }
};
