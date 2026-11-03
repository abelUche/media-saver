import type { uploads } from '@/lib/db/schema';
import type { Channel } from '@/lib/channels';

type Upload = typeof uploads.$inferSelect;

const STATUS: Record<Upload['status'], { label: string; className: string }> = {
  pending: { label: 'Waiting for post', className: 'bg-[#1E1E1C] text-[#D9C3A0]' },
  scheduled: { label: 'Scheduled', className: 'border border-terracotta text-terracotta' },
  published: { label: 'Published', className: 'bg-olive text-olive-text' },
  deleted: { label: 'File deleted', className: 'border border-line-strong text-muted' },
  failed: { label: 'Failed', className: 'bg-[#2A1714] text-[#E8A897]' },
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function scheduledFor(upload: Upload) {
  if (upload.status === 'pending') return 'Not scheduled';
  if (!upload.dueAt) return 'Next queue slot';
  return `${DATE_FORMAT.format(upload.dueAt)} UTC`;
}

type Props = {
  uploads: Upload[];
  channels: Channel[];
  postChannels: Record<string, string[]>;
};

export function UploadsTable({ uploads: rows, channels, postChannels }: Props) {
  const channelNames = new Map(channels.map((channel) => [channel.id, channel.name]));

  function channelsFor(upload: Upload) {
    const ids = postChannels[upload.id] ?? (upload.channelId ? [upload.channelId] : []);
    if (ids.length === 0) return 'Not set';
    return ids.map((id) => channelNames.get(id) ?? 'Unknown channel').join(', ');
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-serif text-4xl font-light">Uploads</h2>
        <span className="text-[13px] text-muted">Files are deleted once every post has published</span>
      </div>

      {rows.length === 0 ? (
        <p className="border-t border-line py-8 text-muted">
          No uploads yet. Schedule a post above, or send one through the API.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-4 pr-4 font-medium">File</th>
                <th className="p-4 font-medium">Channels</th>
                <th className="p-4 font-medium">Scheduled for</th>
                <th className="py-4 pl-4 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((upload) => {
                const status = STATUS[upload.status];
                const isDeleted = upload.status === 'deleted';
                return (
                  <tr key={upload.id} className="border-t border-line last:border-b">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3.5">
                        {isDeleted ? (
                          <span className="size-11 shrink-0 border border-dashed border-line-strong" />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={upload.publicUrl}
                            alt=""
                            loading="lazy"
                            className="size-11 shrink-0 object-cover"
                          />
                        )}
                        <span className={isDeleted ? 'text-muted' : undefined}>
                          {upload.originalName ?? 'Untitled file'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{channelsFor(upload)}</td>
                    <td className="p-4 text-muted">{scheduledFor(upload)}</td>
                    <td className="py-4 pl-4 text-right">
                      <span className={`px-2.5 py-[5px] text-xs font-medium ${status.className}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
