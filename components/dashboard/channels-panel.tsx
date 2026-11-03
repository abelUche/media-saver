import type { Channel } from '@/lib/channels';
import { CopyButton } from '@/components/copy-button';

const SERVICE_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  twitter: 'X',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  googlebusiness: 'Google Business',
};

export function serviceName(service: string) {
  return SERVICE_NAMES[service] ?? service.charAt(0).toUpperCase() + service.slice(1);
}

export function ChannelsPanel({ channels }: { channels: Channel[] | null }) {
  return (
    <section className="flex flex-1 flex-col gap-3.5 bg-olive p-8">
      <h2 className="font-serif text-[26px] font-light">Channels</h2>

      {channels === null ? (
        <p className="text-[13px] leading-relaxed text-olive-text">
          Your channels couldn’t be loaded.{' '}
          <a href="/api/auth/login" className="text-paper underline">
            Reconnect Buffer
          </a>
          , then refresh this page.
        </p>
      ) : channels.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-olive-text">
          No channels yet. Connect a social account in Buffer, then refresh this page.
        </p>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-olive-text">Copy a channel ID into your automation.</p>
          <ul>
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between gap-3 border-t border-[#4B5843] py-3.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium">{channel.name}</span>
                  <span className="text-xs text-olive-text">{serviceName(channel.service)}</span>
                </div>
                <CopyButton
                  value={channel.id}
                  label={`Copy channel ID for ${channel.name}`}
                  className="border border-[#6B7A60] px-3 py-[7px] text-xs hover:border-paper"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}