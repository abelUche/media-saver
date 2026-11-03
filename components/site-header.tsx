import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { HeaderAuthLinks, LoggedOutLinks } from '@/components/auth-links';

type Props = {
  active?: 'docs';
};

export function SiteHeader({ active }: Props) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-6 py-5 md:px-8">
        <Logo />
        <nav className="flex flex-wrap items-center gap-7 text-sm">
          <Link href="/#how" className="text-muted hover:text-paper">
            How it works
          </Link>
          <Link href="/docs" className={active === 'docs' ? 'text-paper' : 'text-muted hover:text-paper'}>
            API docs
          </Link>
          <Suspense fallback={<LoggedOutLinks />}>
            <HeaderAuthLinks />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}