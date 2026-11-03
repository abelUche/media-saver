import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { getSession } from '@/lib/session';
import { getChannels } from '@/lib/channels';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ChannelsPanel } from '@/components/dashboard/channels-panel';
import { UploadsTable } from '@/components/dashboard/uploads-table';
import { getActiveKeys, getRecentUploads } from '@/lib/dashboard-data';
import { ScheduleForm } from '@/components/dashboard/schedule-form';
import { ApiKeysPanel } from '@/components/dashboard/api-keys-panel';

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

      <div className="grid gap-px border border-line bg-line lg:grid-cols-[1.7fr_1fr]">
        <div className="grid gap-px border border-line bg-line lg:grid-cols-[1.7fr_1fr]">
            <ScheduleForm channels={channels ?? []} />
            <div className="grid gap-px">
            <ApiKeysPanel initialKeys={initialKeys} />
            <ChannelsPanel channels={channels} />
            </div>
        </div>
        <div className="grid gap-px">
          <section className="flex flex-col gap-4 bg-ink p-8">
            <h2 className="font-serif text-[26px] font-light">API keys</h2>
            <p className="text-[13px] text-muted">Key management arrives in part 2.</p>
          </section>
          <ChannelsPanel channels={channels} />
        </div>
      </div>

      <UploadsTable uploads={uploadList} channels={channels ?? []} />
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