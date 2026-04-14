# MMS Implementation Guide

## Current Implementation (MVP)

The current MMS implementation uses base64 data URIs passed directly to Twilio. This has significant limitations:

**Issues:**
- Many carriers reject data URIs
- Data URIs may not render properly
- Large payloads can cause API failures
- Not recommended for production

## Production Implementation

For production, you **must** upload map screenshots to cloud storage and use public URLs.

### Option 1: AWS S3 (Recommended)

**1. Install AWS SDK:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**2. Add environment variables:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=osint-dashboard-screenshots
```

**3. Create upload utility (`lib/utils/s3-upload.ts`):**
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadMapScreenshot(
  base64Data: string,
  filename: string
): Promise<string> {
  // Convert base64 to buffer
  const buffer = Buffer.from(
    base64Data.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );

  const bucket = process.env.AWS_S3_BUCKET!;
  const key = `screenshots/${Date.now()}-${filename}`;

  // Upload to S3
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      ACL: 'public-read', // Or use presigned URLs
    })
  );

  // Return public URL
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}
```

**4. Update `app/api/notifications/send-sms/route.ts`:**
```typescript
if (mapSnapshot) {
  // Upload to S3 instead of data URI
  const imageUrl = await uploadMapScreenshot(mapSnapshot, 'map-snapshot.png');
  messageOptions.mediaUrl = [imageUrl];
}
```

**5. Set S3 bucket lifecycle policy:**
- Auto-delete screenshots after 24 hours (save costs)

### Option 2: Cloudinary

**1. Install Cloudinary SDK:**
```bash
npm install cloudinary
```

**2. Add environment variables:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**3. Upload utility:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadMapScreenshot(base64Data: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'osint-screenshots',
    resource_type: 'image',
  });

  return result.secure_url;
}
```

### Option 3: Vercel Blob Storage

**1. Install Vercel Blob:**
```bash
npm install @vercel/blob
```

**2. Create blob upload utility**
**3. Use blob public URL in MMS

## Cost Comparison

**MMS Costs (Twilio):**
- US MMS: ~$0.02-0.05 per message (vs $0.0075 for SMS)
- International MMS: $0.05-0.15 per message

**Storage Costs:**
- AWS S3: $0.023 per GB + $0.0004 per 1000 requests
- Cloudinary: Free tier 25GB, then $0.10 per GB
- Vercel Blob: $0.15 per GB

**Recommendation:** Use S3 with 24-hour lifecycle policy for lowest cost.

## Testing MMS

**Test Carriers:**
- Verizon: Usually works well
- AT&T: May have size limits
- T-Mobile: Generally good support
- Sprint/MVNOs: Variable support

**Image Requirements:**
- Format: PNG or JPEG
- Max size: 500KB (recommended), 5MB (hard limit for most carriers)
- Dimensions: 1024x768 or smaller for best compatibility

## Fallback Strategy

If MMS fails, automatically fall back to SMS-only:

```typescript
try {
  const message = await client.messages.create(messageOptions);
} catch (error) {
  if (error.code === 21604) { // MMS not supported
    console.warn('MMS failed, falling back to SMS');
    delete messageOptions.mediaUrl;
    const message = await client.messages.create(messageOptions);
  }
}
```
