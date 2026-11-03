import Link from 'next/link';
import { Logo } from '@/components/logo';

export function DashboardHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-[18px] md:px-8">
        <div className="flex flex-wrap items-center gap-9">
          <Logo />
          <nav className="flex gap-6 text-sm">
            <Link href="/dashboard" aria-current="page" className="border-b border-terracotta pb-1 text-paper">
              Dashboard
            </Link>
            <Link href="/docs" className="pb-1 text-muted hover:text-paper">
              API docs
            </Link>
          </nav>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="border border-line-strong px-3.5 py-2 text-[13px] hover:border-paper">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}