import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-[13px] text-muted md:px-8">
        <span>Built for #BufferCommit. Not affiliated with Buffer.</span>
        <div className="flex flex-wrap gap-6">
          <Link href="/docs" className="hover:text-paper">API docs</Link>
          <Link href="/privacy" className="hover:text-paper">Privacy policy</Link>
          <a href="https://github.com/abelUche/media-saver" className="hover:text-paper">GitHub</a>
        </div>
      </div>
    </footer>
  );
}