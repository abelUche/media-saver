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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-6 py-4 md:px-8 md:py-5">
        <Logo />
        <div className="ml-auto flex items-center gap-6 text-sm md:order-last md:ml-0">
          <Suspense fallback={<LoggedOutLinks />}>
            <HeaderAuthLinks />
          </Suspense>
        </div>
        <nav className="order-last flex w-full gap-6 text-sm md:order-none md:ml-auto md:w-auto">
          <Link href="/#how" className="text-muted hover:text-paper">
            How it works
          </Link>
          <Link href="/docs" className={active === 'docs' ? 'text-paper' : 'text-muted hover:text-paper'}>
            API docs
          </Link>
        </nav>
      </div>
    </header>
  );
}