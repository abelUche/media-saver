'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshChannelsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/v1/channels', { method: 'POST' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage(data.error ?? 'Channels could not be refreshed. Try again in a minute.');
        return;
      }
      router.refresh();
    } catch {
      setMessage('Media Saver could not be reached. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={refresh}
        disabled={busy}
        className="border border-[#6B7A60] px-3 py-[7px] text-xs hover:border-paper disabled:opacity-50"
      >
        {busy ? 'Refreshing…' : 'Refresh'}
      </button>
      {message && (
        <p role="alert" className="text-right text-xs text-[#E8A897]">
          {message}
        </p>
      )}
    </div>
  );
}
