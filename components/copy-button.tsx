'use client';

import { useState } from 'react';

type Props = {
  value: string;
  label: string;
   idleText?: string;
  className?: string;
};

export function CopyButton({ value, label, idleText = 'Copy ID', className }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} aria-label={label} className={className}>
      {copied ? 'Copied' : idleText}
    </button>
  );
}