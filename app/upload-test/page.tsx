'use client';

import { useState, type ChangeEvent } from 'react';

export default function UploadTest() {
  const [uploadId, setUploadId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [text, setText] = useState('Test post from Media Saver. Not for publishing.');
  const [result, setResult] = useState('');

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setResult('Uploading...');
    const response = await fetch('/api/uploads', { method: 'POST', body: formData });
    const data = await response.json();
    if (response.ok) setUploadId(data.id);
    setResult(JSON.stringify(data, null, 2));
  }

  async function handlePost() {
    setResult('Creating draft post...');
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, channelId, text, draft: true }),
    });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main className="p-8 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Upload test</h1>

      <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFile} />

      <input
        className="w-full border rounded p-2 bg-transparent"
        placeholder="Channel ID"
        value={channelId}
        onChange={(event) => setChannelId(event.target.value)}
      />
      <textarea
        className="w-full border rounded p-2 bg-transparent"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button
        className="border rounded px-4 py-2 disabled:opacity-40"
        disabled={!uploadId || !channelId}
        onClick={handlePost}
      >
        Create draft post
      </button>

      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
    </main>
  );
}