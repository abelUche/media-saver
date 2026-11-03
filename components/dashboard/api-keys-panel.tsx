'use client';

import { useState, type FormEvent } from 'react';
import { CopyButton } from '@/components/copy-button';

export type KeySummary = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function ApiKeysPanel({ initialKeys }: { initialKeys: KeySummary[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Give the key a name, such as “n8n workflow”.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'The key could not be created.');
        return;
      }
      setKeys((current) => [
        { id: data.id, name: data.name, keyPrefix: data.keyPrefix, createdAt: data.createdAt, lastUsedAt: null },
        ...current,
      ]);
      setNewKey(data.key);
      setName('');
    } catch {
      setError('Media Saver could not be reached. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function revokeKey(key: KeySummary) {
    const confirmed = window.confirm(
      `Revoke “${key.name}”? Anything using this key will stop working immediately.`,
    );
    if (!confirmed) return;
    setError(null);
    const response = await fetch(`/api/keys/${key.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('The key could not be revoked. Refresh the page and try again.');
      return;
    }
    setKeys((current) => current.filter((item) => item.id !== key.id));
  }

  return (
    <section className="flex flex-col gap-4 bg-ink p-6 md:p-8">
      <h2 className="font-serif text-[26px] font-light">API keys</h2>
      <p className="text-[13px] leading-relaxed text-muted">
        Use a key in the Authorization header from n8n, Zapier or your scripts. Create one per automation, and{' '}
        <a href="/docs#key-safety" className="text-paper underline">keep it safe</a>.
      </p>

      <form onSubmit={createKey} className="flex gap-2">
        <label htmlFor="key-name" className="sr-only">Key name</label>
        <input
          id="key-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Key name, e.g. n8n workflow"
          maxLength={50}
          className="min-w-0 flex-1 border border-[#34332F] bg-ink px-3 py-2 text-sm text-paper placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-snow px-3.5 py-2 text-[13px] font-semibold text-ink disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create key'}
        </button>
      </form>

      {newKey && (
        <div className="flex flex-col gap-3 border border-terracotta p-4">
          <p className="text-[13px] text-paper">Copy this key now. It won’t be shown again.</p>
          <code className="break-all font-mono text-xs text-terracotta">{newKey}</code>
          <div className="flex gap-2">
            <CopyButton
              value={newKey}
              label="Copy your new API key"
              idleText="Copy key"
              className="bg-terracotta px-3 py-[7px] text-xs font-semibold text-ink"
            />
            <button
              type="button"
              onClick={() => setNewKey(null)}
              className="border border-line-strong px-3 py-[7px] text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-[13px] text-[#E8A897]">{error}</p>}

      {keys.length === 0 ? (
        <p className="border-t border-line pt-3.5 text-[13px] text-muted">No keys yet. Create one for each automation.</p>
      ) : (
        <ul>
          {keys.map((key) => (
            <li key={key.id} className="flex items-center justify-between gap-3 border-t border-line py-3.5">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-medium">{key.name}</span>
                <span className="font-mono text-xs text-muted">{key.keyPrefix}••••</span>
                <span className="text-xs text-muted">
                  {key.lastUsedAt
                    ? `Last used ${DATE_FORMAT.format(new Date(key.lastUsedAt))}`
                    : `Created ${DATE_FORMAT.format(new Date(key.createdAt))}, not used yet`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => revokeKey(key)}
                aria-label={`Revoke ${key.name}`}
                className="shrink-0 border border-line-strong px-3 py-[7px] text-xs text-[#E3A08A] hover:border-[#E3A08A]"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}