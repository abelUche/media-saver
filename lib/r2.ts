import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
};

export const PRESIGN_EXPIRES_SECONDS = 10 * 60;

function newKey(contentType: string) {
  const extension = ALLOWED_TYPES[contentType];
  if (!extension) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }
  return `${randomUUID()}.${extension}`;
}

function publicUrlFor(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function uploadFile(body: Uint8Array, contentType: string) {
  const key = newKey(contentType);
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, publicUrl: publicUrlFor(key) };
}

export async function presignUpload(contentType: string, size: number) {
  const key = newKey(contentType);
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    }),
    { expiresIn: PRESIGN_EXPIRES_SECONDS },
  );
  return { key, uploadUrl, publicUrl: publicUrlFor(key) };
}

export async function getFileInfo(key: string): Promise<{ size: number } | null> {
  try {
    const result = await r2.send(
      new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
    );
    return { size: result.ContentLength ?? 0 };
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

export async function deleteFile(key: string) {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}