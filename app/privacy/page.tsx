import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'Privacy policy | Media Saver',
  description: 'What Media Saver stores, why, and for how long.',
};

const CONTACT_EMAIL = 'abeluche04@gmail.com';
const LAST_UPDATED = '3 November 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-10">
      <h2 className="font-serif text-3xl font-light">{title}</h2>
      <div className="flex flex-col gap-4 leading-[1.75] text-muted">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex max-w-[720px] flex-col gap-10 px-6 pb-32 pt-20 md:px-8">
        <div className="flex flex-col gap-5">
          <h1 className="font-serif text-5xl font-light leading-none tracking-[-0.02em] md:text-6xl">
            Privacy policy
          </h1>
          <p className="text-sm text-muted">Last updated {LAST_UPDATED}</p>
          <p className="text-base leading-[1.75] text-muted">
            Media Saver hosts images for posts you create through the Buffer API, then deletes them once they are
            published. This page explains exactly what it stores, why, and for how long.
          </p>
        </div>

        <Section title="What Media Saver stores">
          <p>When you connect your Buffer account:</p>
          <List
            items={[
              'Your Buffer account ID, so Media Saver can recognise you when you return.',
              'The access and refresh tokens Buffer issues, encrypted before they are saved. They let Media Saver create posts and check their status on your behalf.',
              'A list of your Buffer channels (names, IDs, networks and organisation name), cached for up to 10 minutes to reduce requests to Buffer.',
            ]}
          />
          <p>When you send a post:</p>
          <List
            items={[
              'The image you upload, stored under a random, unguessable name.',
              'The original file name, the channel it was posted to, the Buffer post ID and the scheduled time, so your dashboard can show each upload and its status.',
            ]}
          />
          <p>When you create an API key:</p>
          <List
            items={[
              'A one-way hash of the key, never the key itself, plus the name you gave it, its first few characters, when it was created and when it was last used.',
            ]}
          />
          <p>
            Media Saver never sees your Buffer password, and it does not store your post text after the post is
            created in Buffer.
          </p>
        </Section>

        <Section title="Your images are public while hosted">
          <p>
            Buffer requires every image to be available at a public web address until the post goes out. While an
            image is hosted, anyone who has its exact address can view it. Addresses are long and random, so they
            cannot be guessed, but do not upload anything you would not post publicly.
          </p>
        </Section>

        <Section title="How long things are kept">
          <List
            items={[
              'Images are deleted at the first daily cleanup after Buffer reports the post as published, or after the post is deleted in Buffer.',
              'Images that were uploaded but never used in a post are deleted after 7 days.',
              'Images for posts that failed to publish are kept so you can retry. Ask, and they will be deleted.',
              'Upload records (file name, status and dates) stay so your dashboard history remains accurate. The image itself is gone.',
              'Your account details and tokens are kept until you ask for them to be deleted.',
            ]}
          />
        </Section>

        <Section title="Cookies">
          <p>
            Media Saver uses one cookie, which keeps you logged in. It is encrypted and contains no tracking
            information. There are no analytics, advertising or tracking cookies.
          </p>
        </Section>

        <Section title="Services that process your data">
          <p>Media Saver relies on these providers to run:</p>
          <List
            items={[
              'Buffer, which receives your posts and images and publishes them to your channels.',
              'Vercel, which hosts the app and keeps short-lived request logs.',
              'Neon, which hosts the database.',
              'Cloudflare, which stores the images (R2) and manages the domain.',
            ]}
          />
          <p>Media Saver does not sell your data or share it with anyone else.</p>
        </Section>

        <Section title="Disconnecting and deleting your data">
          <p>
            To stop Media Saver accessing your Buffer account immediately, remove it from the connected apps in your
            Buffer account settings. Its tokens stop working straight away.
          </p>
          <p>
            To have your data deleted, including your account record, upload history and any remaining images,
            email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-paper underline">
              {CONTACT_EMAIL}
            </a>{' '}
            from the email address on your Buffer account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If what Media Saver stores changes, this page will be updated and the date at the top will change.
          </p>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}