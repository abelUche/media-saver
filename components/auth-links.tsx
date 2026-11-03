import Link from 'next/link';
import { getSession } from '@/lib/session';
import { connection } from 'next/server';

const HEADER_BUTTON = 'bg-snow px-[18px] py-2.5 font-semibold text-ink';

export function LoggedOutLinks() {
  return (
    <>
      <a href="/api/auth/login" className="text-muted hover:text-paper">
        Log in
      </a>
      <a href="/api/auth/login" className={HEADER_BUTTON}>
        Connect Buffer
      </a>
    </>
  );
}

export async function HeaderAuthLinks() {
  await connection();
  const session = await getSession();
  if (!session.userId) return <LoggedOutLinks />;
  return (
    <Link href="/dashboard" className={HEADER_BUTTON}>
      Open dashboard
    </Link>
  );
}

type CtaProps = { className: string };

export function ConnectCta({ className }: CtaProps) {
  return (
    <a href="/api/auth/login" className={className}>
      Connect your Buffer account
    </a>
  );
}

export async function SessionCta({ className }: CtaProps) {
  await connection();
  const session = await getSession();
  if (!session.userId) return <ConnectCta className={className} />;
  return (
    <Link href="/dashboard" className={className}>
      Open your dashboard
    </Link>
  );
}