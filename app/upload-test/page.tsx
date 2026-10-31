'use client';

import { useState, type ChangeEvent } from 'react';

export default function UploadTest() {
  const [result, setResult] = useState('');

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setResult('Uploading...');
    const response = await fetch('/api/uploads', { method: 'POST', body: formData });
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-semibold">Upload test</h1>
      <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleChange} />
      <pre className="whitespace-pre-wrap text-sm">{result}</pre>
    </main>
  );
}