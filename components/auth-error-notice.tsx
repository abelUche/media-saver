'use client';

import { useSearchParams } from 'next/navigation';

const MESSAGES: Record<string, string> = {
  access_denied: 'You cancelled the connection, so nothing was shared with Media Saver. Connect again whenever you’re ready.',
  no_refresh_token: 'Buffer didn’t complete the connection. Please try connecting again.',
};

const FALLBACK = 'Something went wrong while connecting to Buffer. Please try again.';

export function AuthErrorNotice() {
  const error = useSearchParams().get('error');
  if (!error) return null;

  return (
    <div role="alert" className="border border-line-strong bg-surface px-5 py-4 text-sm leading-relaxed text-paper">
      {MESSAGES[error] ?? FALLBACK}
    </div>
  );
}
