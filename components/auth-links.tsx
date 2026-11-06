import Link from 'next/link';
import { connection } from 'next/server';
import { getSession } from '@/lib/session';
import { LoginLink } from '@/components/login-link';

const HEADER_BUTTON =
  'bg-snow px-3 py-2 text-[13px] font-semibold text-ink hover:bg-paper sm:px-[18px] sm:py-2.5 sm:text-sm';

export function LoggedOutLinks() {
  return <LoginLink className={HEADER_BUTTON}>Connect Buffer</LoginLink>;
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
  return <LoginLink className={className}>Connect your Buffer account</LoginLink>;
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
