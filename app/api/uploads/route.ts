import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { uploadFile, ALLOWED_TYPES } from '@/lib/r2';
import { db } from '@/lib/db';
import { uploads } from '@/lib/db/schema';

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
        return NextResponse.json({ error: 'Not logged in or invalid API key' }, { status: 401 });
    }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is larger than 4 MB' }, { status: 413 });
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const { key, publicUrl } = await uploadFile(body, file.type);

  const [upload] = await db
    .insert(uploads)
    .values({ userId: userId, r2Key: key, publicUrl, originalName: file.name })
    .returning({ id: uploads.id });

  return NextResponse.json({ id: upload.id, url: publicUrl }, { status: 201 });
}