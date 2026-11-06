'use client';

import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  className: string;
  children: ReactNode;
  pendingLabel?: string;
};

const RESET_AFTER_MS = 10 * 1000;

export function LoginLink({ className, children, pendingLabel = 'Connecting…' }: Props) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Coming back with the Back button can restore the page with its old state, so reset it.
    const reset = () => setPending(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  useEffect(() => {
    if (!pending) return;
    // A safety net: never leave the button stuck if navigation is cancelled or slow.
    const timer = setTimeout(() => setPending(false), RESET_AFTER_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <a
      href="/api/auth/login"
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap ${className} ${
        pending ? 'pointer-events-none opacity-80' : ''
      }`}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
        />
      )}
      {pending ? pendingLabel : children}
    </a>
  );
}
