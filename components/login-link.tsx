'use client';

import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  className: string;
  children: ReactNode;
};

export function LoginLink({ className, children }: Props) {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // If the visitor comes back with the browser's Back button, the page can be restored
    // from memory with the old state, so reset it.
    const reset = () => setPending(false);
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  return (
    <a
      href="/api/auth/login"
      onClick={() => setPending(true)}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 ${className} ${pending ? 'pointer-events-none opacity-80' : ''}`}
    >
      {pending && (
        <span
          aria-hidden="true"
          className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
        />
      )}
      {pending ? 'Connecting to Buffer…' : children}
    </a>
  );
}
