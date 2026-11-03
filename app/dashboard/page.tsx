import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from '@/lib/session';
import { getChannels } from '@/lib/channels';
import { getActiveKeys, getRecentUploads, getUploadChannels } from '@/lib/dashboard-data';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ScheduleForm } from '@/components/dashboard/schedule-form';
import { ApiKeysPanel } from '@/components/dashboard/api-keys-panel';
import { ChannelsPanel } from '@/components/dashboard/channels-panel';
import { UploadsTable } from '@/components/dashboard/uploads-table';

export const metadata: Metadata = {
  title: 'Dashboard | Media Saver',
};

async function DashboardContent() {
  await connection();
  const session = await getSession();
  if (!session.userId) {
    redirect('/');
  }
  const userId = session.userId;

  const [uploadList, channels, keys] = await Promise.all([
    getRecentUploads(userId),
    getChannels(userId).catch((error) => {
      console.error('Could not load channels:', error);
      return null;
    }),
    getActiveKeys(userId),
  ]);

    const postChannels = await getUploadChannels(uploadList.map((upload) => upload.id)).catch(
    (error) => {
      console.error('Could not load upload channels:', error.cause ?? error);
      return {} as Record<string, string[]>;
    },
  );

  const initialKeys = keys.map((key) => ({
    ...key,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
  }));

  const organizationName = channels?.[0]?.organizationName;

  return (
    <>
      <p className="-mt-8 text-[13px] text-muted">
        {organizationName ? `Connected to Buffer as ${organizationName}` : 'Connected to Buffer'}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-px border border-line bg-line lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <ScheduleForm channels={channels ?? []} />
        <div className="grid min-w-0 gap-px">
          <ApiKeysPanel initialKeys={initialKeys} />
          <ChannelsPanel channels={channels} />
        </div>
      </div>

      <UploadsTable uploads={uploadList} channels={channels ?? []} postChannels={postChannels} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader />
      <main className="mx-auto flex max-w-[1240px] flex-col gap-12 px-6 pb-28 pt-16 md:px-8 md:pt-[72px]">
        <h1 className="font-serif text-5xl font-light leading-none tracking-[-0.02em] md:text-6xl">Dashboard</h1>
        <Suspense fallback={<p className="text-muted">Loading your dashboard…</p>}>
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}
