'use client';

import { useState, type DragEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Channel } from '@/lib/channels';
import { serviceName } from '@/lib/services';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_BYTES = 20 * 1024 * 1024;

const LABEL = 'text-xs text-muted';
const INPUT = 'border border-[#34332F] bg-ink p-3 text-sm text-paper';

type Status =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; message: string };

type Phase = 'idle' | 'uploading' | 'scheduling';

export function ScheduleForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(channels[0] ? [channels[0].id] : []);
  const [when, setWhen] = useState<'queue' | 'time'>('queue');
  const [dueLocal, setDueLocal] = useState('');
  const [text, setText] = useState('');
  const [asDraft, setAsDraft] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function toggleChannel(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function channelNames(ids: string[]) {
    return ids.map((id) => channels.find((channel) => channel.id === id)?.name ?? id).join(', ');
  }

  function chooseFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!ALLOWED_TYPES.includes(candidate.type)) {
      setStatus({ kind: 'error', message: 'Choose a JPEG, PNG or GIF image.' });
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setStatus({ kind: 'error', message: 'This image is larger than 20 MB. Export a smaller copy and try again.' });
      return;
    }
    setFile(candidate);
    setStatus({ kind: 'idle' });
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus({ kind: 'error', message: 'Choose an image to post.' });
      return;
    }
    if (selectedIds.length === 0) {
      setStatus({ kind: 'error', message: 'Choose at least one channel.' });
      return;
    }
    if (!text.trim()) {
      setStatus({ kind: 'error', message: 'Write the post text.' });
      return;
    }
    if (when === 'time' && !dueLocal) {
      setStatus({ kind: 'error', message: 'Choose a date and time, or use the next queue slot.' });
      return;
    }

    setStatus({ kind: 'idle' });
    setPhase('uploading');
    try {
      const slotResponse = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
      });
      const slot = await slotResponse.json();
      if (!slotResponse.ok) {
        setStatus({ kind: 'error', message: slot.error ?? 'The upload could not be started.' });
        return;
      }

      const putResponse = await fetch(slot.uploadUrl, {
        method: 'PUT',
        headers: slot.headers,
        body: file,
      });
      if (!putResponse.ok) {
        setStatus({ kind: 'error', message: 'The image could not be uploaded to storage. Try again.' });
        return;
      }

      setPhase('scheduling');
      const postResponse = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId: slot.uploadId,
          channelIds: selectedIds,
          text,
          dueAt: when === 'time' ? new Date(dueLocal).toISOString() : undefined,
          draft: asDraft,
        }),
      });
      const data = await postResponse.json();
      if (!postResponse.ok) {
        setStatus({ kind: 'error', message: data.error ?? 'The post could not be created.' });
        return;
      }

      const count: number = data.posts?.length ?? 1;
      const failed: { channelId: string; error: string }[] = data.errors ?? [];
      const done = asDraft ? 'Saved as a draft' : 'Scheduled';
      const plural = count === 1 ? '' : 's';

      if (failed.length > 0) {
        setStatus({
          kind: 'error',
          message: `${done} on ${count} channel${plural}. Failed on ${channelNames(
            failed.map((item) => item.channelId),
          )}: ${failed[0].error}`,
        });
      } else {
        setStatus({ kind: 'success', message: `${done} on ${count} channel${plural} in Buffer.` });
      }

      setFile(null);
      setInputKey((key) => key + 1);
      setText('');
      setDueLocal('');
      router.refresh();
    } catch {
      setStatus({ kind: 'error', message: 'Media Saver could not be reached. Check your connection and try again.' });
    } finally {
      setPhase('idle');
    }
  }

  if (channels.length === 0) {
    return (
      <section className="flex flex-col gap-4 bg-ink p-6 md:p-9">
        <h2 className="font-serif text-3xl font-light">Schedule a post</h2>
        <p className="text-muted">Connect a social account in Buffer to start scheduling posts here.</p>
      </section>
    );
  }

  const busy = phase !== 'idle';
  const buttonLabel =
    phase === 'uploading' ? 'Uploading…' : phase === 'scheduling' ? 'Scheduling…' : asDraft ? 'Save draft' : 'Schedule post';

  return (
    <section className="flex flex-col gap-[22px] bg-ink p-6 md:p-9">
      <h2 className="font-serif text-3xl font-light">Schedule a post</h2>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[22px]">
        <div>
          <input
            key={inputKey}
            id="image-file"
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            className="peer sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          <label
            htmlFor="image-file"
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-wrap items-center gap-[18px] border border-dashed p-6 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terracotta md:p-8 ${
              dragging ? 'border-terracotta' : 'border-line-strong'
            }`}
          >
            <svg width="34" height="34" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="22" height="22" className="stroke-muted" strokeWidth="1.2" />
              <path d="M7 19l4.5-5.5 3.2 3.6 2.3-2.6L21 19" className="stroke-muted" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <span className="flex min-w-0 flex-1 basis-[200px] flex-col gap-1">
              <span className="truncate text-[15px]">{file ? file.name : 'Drop an image here, or click to choose'}</span>
              <span className="text-xs text-muted">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'JPEG, PNG or GIF, up to 20 MB'}
              </span>
            </span>
            <span className="bg-snow px-[18px] py-[11px] text-sm font-semibold text-ink">
              {file ? 'Change image' : 'Choose image'}
            </span>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <fieldset className="flex min-w-0 flex-col gap-2">
            <legend className={`${LABEL} mb-2`}>
              Channels{selectedIds.length > 1 ? ` (${selectedIds.length} selected)` : ''}
            </legend>
            <div className="flex flex-col border border-[#34332F]">
              {channels.map((channel) => (
                <label
                  key={channel.id}
                  className="flex cursor-pointer items-center gap-3 border-t border-[#34332F] p-3 text-sm first:border-t-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(channel.id)}
                    onChange={() => toggleChannel(channel.id)}
                    className="size-4 shrink-0 accent-terracotta"
                  />
                  <span className="min-w-0 truncate">
                    {channel.name} <span className="text-muted">({serviceName(channel.service)})</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="when" className={LABEL}>When</label>
            <select
              id="when"
              value={when}
              onChange={(event) => setWhen(event.target.value as 'queue' | 'time')}
              className={INPUT}
            >
              <option value="queue">Next free slot in my Buffer queue</option>
              <option value="time">A specific date and time</option>
            </select>
          </div>
        </div>

        {when === 'time' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="due" className={LABEL}>Date and time (your time zone)</label>
            <input
              id="due"
              type="datetime-local"
              value={dueLocal}
              onChange={(event) => setDueLocal(event.target.value)}
              className={`${INPUT} [color-scheme:dark]`}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="post-text" className={LABEL}>Post text</label>
          <textarea
            id="post-text"
            rows={4}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className={`${INPUT} resize-y leading-relaxed`}
          />
          <span className="self-end text-xs text-muted">{text.length.toLocaleString('en-GB')} characters</span>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={asDraft}
            onChange={(event) => setAsDraft(event.target.checked)}
            className="size-4 accent-terracotta"
          />
          Save as a draft in Buffer instead of scheduling
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-[22px]">
          <p
            role="status"
            className={`text-[13px] ${
              status.kind === 'error' ? 'text-[#E8A897]' : status.kind === 'success' ? 'text-olive-text' : 'text-muted'
            }`}
          >
            {status.kind === 'idle' ? 'The image stays hosted until Buffer publishes every post.' : status.message}
          </p>
          <button
            type="submit"
            disabled={busy}
            className="bg-terracotta px-[22px] py-[13px] text-sm font-semibold text-ink hover:bg-terracotta-hover disabled:opacity-50"
          >
            {buttonLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
