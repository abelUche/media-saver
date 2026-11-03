import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-paper">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="22" height="22" className="stroke-terracotta" strokeWidth="1.6" />
        <path
          d="M7 19l4.5-5.5 3.2 3.6 2.3-2.6L21 19"
          className="stroke-paper"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="18.5" cy="9.5" r="1.7" className="fill-terracotta" />
      </svg>
      <span className="font-serif text-[21px] tracking-[-0.01em]">Media Saver</span>
    </Link>
  );
}