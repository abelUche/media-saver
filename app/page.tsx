import { Suspense } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { MediaFlow } from '@/components/media-flow';
import { ConnectCta, SessionCta } from '@/components/auth-links';

const CURL_EXAMPLE = `curl -X POST https://media-saver-six.vercel.app/api/v1/posts \\
  -H "Authorization: Bearer ms_live_••••••••" \\
  -F "file=@launch.jpg" \\
  -F "channelId=YOUR_CHANNEL_ID" \\
  -F "text=We just shipped it." \\
  -F "dueAt=2026-11-05T10:00:00Z"`;

const RESPONSE_EXAMPLE = `{
  "postId": "6ae578a0b84259308bbbe3d6",
  "status": "scheduled",
  "dueAt": "2026-11-05T10:00:00.000Z"
}`;

const TRUST_POINTS = [
  {
    title: 'Files live only as long as needed',
    text: 'Each file keeps a stable public link until its post is sent, then it is deleted. When in doubt, the file is kept, never removed early.',
  },
  {
    title: 'Buffer stays in charge',
    text: 'Your queue, schedule and publishing all run in Buffer. Media Saver only fills the media gap.',
  },
  {
    title: 'Secure by default',
    text: 'OAuth with PKCE, encrypted tokens, hashed API keys and unguessable file names.',
  },
];

const HERO_CTA = 'bg-terracotta px-6 py-[15px] font-semibold text-ink hover:bg-terracotta-hover';
const BAND_CTA = 'bg-ink px-[26px] py-4 font-semibold text-snow hover:bg-black';

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-20 md:px-8 md:pt-28 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-7">
            <p className="text-sm text-muted">Media hosting for the Buffer API</p>
            <h1 className="font-serif text-5xl font-light leading-[1.02] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
              Post images through the Buffer API,{' '}
              <em className="italic text-terracotta">without hosting them.</em>
            </h1>
            <p className="max-w-[480px] text-base leading-relaxed text-muted">
              Send Media Saver a file and your post. It stores the image, schedules the post in your
              Buffer account, and deletes the file once it has been published.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <Suspense fallback={<ConnectCta className={HERO_CTA} />}>
                <SessionCta className={HERO_CTA} />
              </Suspense>
              <Link href="/docs" className="border-b border-line-strong pb-[3px] font-medium hover:border-paper">
                Read the API docs
              </Link>
            </div>
          </div>
          <MediaFlow />
        </section>

        <section className="border-y border-line">
          <div className="mx-auto grid max-w-6xl md:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0 border-line px-6 py-10 md:border-r md:px-8">
              <p className="mb-4 text-sm text-muted">Request</p>
              <pre className="overflow-x-auto font-mono text-[13px] leading-[1.8]">{CURL_EXAMPLE}</pre>
            </div>
            <div className="min-w-0 border-t border-line px-6 py-10 md:border-t-0 md:px-8">
              <p className="mb-4 text-sm text-muted">Response, 201 Created</p>
              <pre className="overflow-x-auto font-mono text-[13px] leading-[1.8] text-terracotta">
                {RESPONSE_EXAMPLE}
              </pre>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-end gap-12 px-6 pb-28 pt-32 md:grid-cols-[1.6fr_1fr] md:gap-24 md:px-8">
          <h2 className="font-serif text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-6xl">
            The Buffer API has no upload endpoint.
          </h2>
          <div className="flex flex-col gap-4 leading-[1.7] text-muted">
            <p>
              Every image must already sit at a public link you host, and it has to stay there until
              the post goes out, which can be days later.
            </p>
            <p>Easy in a browser. Hard in an automation. Media Saver is that host.</p>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 pb-32 md:px-8">
          <h2 className="pb-10 font-serif text-4xl font-light tracking-[-0.02em] md:text-5xl">How it works</h2>
          <div className="grid gap-px border border-line bg-line md:grid-cols-[1fr_1.5fr] md:grid-rows-2">
            <div className="flex flex-col gap-3.5 bg-olive px-9 py-10 md:col-start-1 md:row-start-1">
              <span className="font-serif text-xl text-olive-text">01</span>
              <h3 className="font-serif text-[28px] font-light leading-[1.15]">Connect Buffer</h3>
              <p className="text-sm leading-[1.65] text-olive-text">
                Approve Media Saver on Buffer’s own screen. Your login stays with Buffer, and tokens are
                encrypted at rest.
              </p>
            </div>
            <div className="flex min-h-[420px] flex-col gap-5 bg-ink px-10 py-12 md:col-start-2 md:row-span-2 md:row-start-1">
              <span className="font-serif text-xl text-terracotta">02</span>
              <h3 className="font-serif text-4xl font-light leading-[1.1]">
                Send a file and your post, in one request.
              </h3>
              <p className="max-w-[440px] leading-[1.7] text-muted">
                Your API key, the image, the text, the channel and an optional time. Media Saver hosts
                the file and creates the post in your Buffer account.
              </p>
              <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2.5 border-t border-line pt-5 font-mono text-[13px] text-muted">
                <span>file</span>
                <span>channelId</span>
                <span>text</span>
                <span>dueAt</span>
              </div>
            </div>
            <div className="flex flex-col gap-3.5 bg-ink px-9 py-10 md:col-start-1 md:row-start-2">
              <span className="font-serif text-xl text-terracotta">03</span>
              <h3 className="font-serif text-[28px] font-light leading-[1.15]">Published, then cleaned up</h3>
              <p className="text-sm leading-[1.65] text-muted">
                Buffer publishes on schedule. Once the post is sent, Media Saver deletes the file, so
                nothing piles up.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-28 md:grid-cols-[1fr_1.3fr] md:gap-24 md:px-8">
            <h2 className="font-serif text-4xl font-light leading-[1.1] tracking-[-0.02em] md:text-[44px]">
              Built for the tools that post for you.
            </h2>
            <p className="font-serif text-2xl font-light leading-normal text-muted md:text-[28px]">
              n8n <span className="text-line-strong">/</span> Zapier <span className="text-line-strong">/</span> Make{' '}
              <span className="text-line-strong">/</span> AI agents <span className="text-line-strong">/</span>{' '}
              <span className="text-paper">your own scripts</span>
            </p>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 pb-32 pt-28 md:px-8">
            <p className="mb-12 text-sm text-muted">Why you can trust it</p>
            {TRUST_POINTS.map((point) => (
              <div
                key={point.title}
                className="grid gap-6 border-t border-line py-8 last:border-b md:grid-cols-[1fr_1.4fr] md:gap-16"
              >
                <h3 className="font-serif text-[30px] font-light">{point.title}</h3>
                <p className="leading-[1.7] text-muted">{point.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-snow text-ink">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-10 px-6 py-28 md:px-8">
            <h2 className="max-w-[720px] font-serif text-4xl font-light leading-[1.05] tracking-[-0.02em] md:text-[56px]">
              Your images, hosted exactly as long as they’re needed.
            </h2>
            <Suspense fallback={<ConnectCta className={BAND_CTA} />}>
              <SessionCta className={BAND_CTA} />
            </Suspense>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-[13px] text-muted md:px-8">
          <span>Built for #BufferCommit. Not affiliated with Buffer.</span>
          <div className="flex flex-wrap gap-6">
            <Link href="/docs" className="hover:text-paper">API docs</Link>
            <Link href="/privacy" className="hover:text-paper">Privacy policy</Link>
            <a href="https://github.com/abelUche/media-saver" className="hover:text-paper">GitHub</a>
          </div>
        </div>
      </footer>
    </>
  );
}