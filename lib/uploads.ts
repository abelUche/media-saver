import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';
import { uploadFile, ALLOWED_TYPES } from '@/lib/r2';
import { ApiError } from '@/lib/errors';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function saveUpload(userId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File)) {
    throw new ApiError('No file provided', 400);
  }
  if (!ALLOWED_TYPES[file.type]) {
    throw new ApiError(`Unsupported file type: ${file.type}`, 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError('File is larger than 4 MB', 413);
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const { key, publicUrl } = await uploadFile(body, file.type);

  const [upload] = await db
    .insert(uploads)
    .values({ userId, r2Key: key, publicUrl, originalName: file.name })
    .returning();

  return upload;
}