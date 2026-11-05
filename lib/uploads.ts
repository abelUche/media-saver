import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import {
  uploadFile,
  presignUpload,
  ALLOWED_TYPES,
  PRESIGN_EXPIRES_SECONDS,
  isVideoType,
  isVideoKey,
} from '@/lib/r2';
import { ApiError } from '@/lib/errors';

const MB = 1024 * 1024;

// One-call multipart uploads pass through Vercel, which caps request bodies at about 4.5 MB.
export const MAX_UPLOAD_BYTES = 4 * MB;

// Direct-to-R2 uploads skip Vercel, so they can be much larger.
export const MAX_IMAGE_BYTES = 20 * MB;
export const MAX_VIDEO_BYTES = 100 * MB;

// Kept so any older import still works.
export const MAX_DIRECT_UPLOAD_BYTES = MAX_IMAGE_BYTES;

export function maxBytesFor(contentType: string) {
  return isVideoType(contentType) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function maxBytesForKey(key: string) {
  return isVideoKey(key) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function sizeLabel(bytes: number) {
  return `${Math.round(bytes / MB)} MB`;
}

export async function saveUpload(userId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File)) {
    throw new ApiError('No file provided', 400);
  }
  if (!ALLOWED_TYPES[file.type]) {
    throw new ApiError(`Unsupported file type: ${file.type}`, 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      'File is larger than 4 MB. Use the two-step upload (POST /api/v1/uploads) for bigger files and videos.',
      413,
    );
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const { key, publicUrl } = await uploadFile(body, file.type);

  const [upload] = await db
    .insert(uploads)
    .values({ userId, r2Key: key, publicUrl, originalName: file.name })
    .returning();

  return upload;
}

export async function createUploadSlot(userId: string, input: Record<string, unknown>) {
  const { fileName, contentType, size } = input;

  if (typeof contentType !== 'string' || !ALLOWED_TYPES[contentType]) {
    throw new ApiError(`Unsupported file type: ${String(contentType)}`, 415);
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
    throw new ApiError('size must be the file size in bytes', 400);
  }
  const maxBytes = maxBytesFor(contentType);
  if (size > maxBytes) {
    throw new ApiError(`File is larger than ${sizeLabel(maxBytes)}`, 413);
  }

  const originalName =
    typeof fileName === 'string' && fileName.trim() ? fileName.trim().slice(0, 200) : null;

  const { key, uploadUrl, publicUrl } = await presignUpload(contentType, size);

  const [upload] = await db
    .insert(uploads)
    .values({ userId, r2Key: key, publicUrl, originalName })
    .returning({ id: uploads.id });

  return {
    uploadId: upload.id,
    uploadUrl,
    publicUrl,
    expiresIn: PRESIGN_EXPIRES_SECONDS,
    headers: { 'Content-Type': contentType },
  };
}
