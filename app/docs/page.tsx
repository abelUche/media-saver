import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export const metadata: Metadata = {
  title: 'API docs | Media Saver',
  description: 'Upload an image or video and schedule Buffer posts on one or more channels with one request.',
};

const BASE_URL = 'https://mediasaver.si/api/v1';

// Set this to the workflow file's link (for example on GitHub) once it's published.
const N8N_WORKFLOW_URL: string | null = '/media-saver-n8n-workflow.json';

const SECTIONS = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'key-safety', label: 'Keeping keys safe' },
  { id: 'create-post', label: 'Create a post' },
  { id: 'multiple-channels', label: 'Multiple channels' },
  { id: 'large-files', label: 'Large files and video' },
  { id: 'networks', label: 'Network notes' },
  { id: 'list-channels', label: 'Channels' },
  { id: 'errors', label: 'Errors' },
  { id: 'rate-limits', label: 'Rate limits' },
  { id: 'n8n', label: 'Using n8n' },
];

const POST_FIELDS = [
  {
    name: 'file',
    required: 'Yes',
    description:
      'A JPEG, PNG or GIF image, or an MP4 video, up to 4 MB. For larger images (up to 20 MB) and videos (up to 100 MB), use the two-step upload.',
  },
  {
    name: 'channelId',
    required: 'Yes',
    description:
      'A channel ID from your dashboard or GET /channels. Repeat the field to post to several channels at once, up to 10.',
  },
  { name: 'text', required: 'Yes', description: 'The post text, within each network’s character limit.' },
  {
    name: 'dueAt',
    required: 'No',
    description:
      'ISO 8601 time to publish, such as 2026-11-05T10:00:00Z or 2026-11-05T11:00:00+01:00. Leave it out to use the next free slot in each channel’s Buffer queue.',
  },
  {
    name: 'draft',
    required: 'No',
    description: 'Set to true to save the post as a draft in Buffer instead of scheduling it. Useful for testing.',
  },
];

const ERRORS = [
  { code: '400', meaning: 'A required field is missing or invalid. The message names the field.' },
  { code: '401', meaning: 'The API key is missing or revoked, or your Buffer connection needs renewing.' },
  { code: '404', meaning: 'Something you referenced, such as an upload, was not found.' },
  { code: '409', meaning: 'The file has not been uploaded yet, or that upload already has a post.' },
  {
    code: '413',
    meaning: 'The file is too large: 4 MB in one request, or 20 MB for images and 100 MB for videos with the two-step upload.',
  },
  { code: '415', meaning: 'The file type is not supported. Use JPEG, PNG, GIF or MP4.' },
  {
    code: '422',
    meaning:
      'Buffer rejected the post on every channel. The errors list says why for each one, and uploadId lets you retry without uploading again.',
  },
  { code: '429', meaning: 'Rate limit reached. Wait for the number of seconds in the Retry-After header.' },
];

const AUTH_EXAMPLE = `Authorization: Bearer ms_live_your_key_here`;

const POST_EXAMPLE = `curl -X POST ${BASE_URL}/posts \\
  -H "Authorization: Bearer ms_live_your_key_here" \\
  -F "file=@launch.jpg" \\
  -F "channelId=YOUR_CHANNEL_ID" \\
  -F "text=We just shipped it." \\
  -F "dueAt=2026-11-05T10:00:00Z"`;

const POST_RESPONSE = `{
  "uploadId": "97737c17-90b2-4aa5-8896-3cdc071614aa",
  "postId": "6ae578a0b84259308bbbe3d6",
  "status": "scheduled",
  "dueAt": "2026-11-05T10:00:00.000Z",
  "posts": [
    {
      "channelId": "6ad9a464778b240e2f87c827",
      "postId": "6ae578a0b84259308bbbe3d6",
      "status": "scheduled",
      "dueAt": "2026-11-05T10:00:00.000Z"
    }
  ],
  "errors": []
}`;

const MULTI_EXAMPLE = `curl -X POST ${BASE_URL}/posts \\
  -H "Authorization: Bearer ms_live_your_key_here" \\
  -F "file=@launch.jpg" \\
  -F "channelId=FIRST_CHANNEL_ID" \\
  -F "channelId=SECOND_CHANNEL_ID" \\
  -F "text=We just shipped it."`;

const PARTIAL_RESPONSE = `{
  "uploadId": "700eec20-263a-4ccd-a9bd-250f141d9e12",
  "postId": "6aec57d56d2f01d30a237742",
  "status": "scheduled",
  "dueAt": "2026-11-05T14:08:00.000Z",
  "posts": [
    {
      "channelId": "FIRST_CHANNEL_ID",
      "postId": "6aec57d56d2f01d30a237742",
      "status": "scheduled",
      "dueAt": "2026-11-05T14:08:00.000Z"
    }
  ],
  "errors": [
    { "channelId": "SECOND_CHANNEL_ID", "error": "The reason Buffer gave" }
  ]
}`;

const CHANNELS_EXAMPLE = `curl ${BASE_URL}/channels \\
  -H "Authorization: Bearer ms_live_your_key_here"`;

const CHANNELS_REFRESH_EXAMPLE = `curl -X POST ${BASE_URL}/channels \\
  -H "Authorization: Bearer ms_live_your_key_here"`;

const CHANNELS_RESPONSE = `{
  "channels": [
    {
      "id": "6ad9a464778b240e2f87c827",
      "name": "my-company",
      "service": "linkedin",
      "organizationName": "My Organization"
    }
  ]
}`;

const ERROR_RESPONSE = `{
  "error": "text is required"
}`;

const UPLOAD_STEP_1 = `curl -X POST ${BASE_URL}/uploads \\
  -H "Authorization: Bearer ms_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"fileName":"demo.mp4","contentType":"video/mp4","size":48123456}'`;

const UPLOAD_STEP_1_RESPONSE = `{
  "uploadId": "7b90b90b-9c9d-4689-8571-a0de326552e8",
  "uploadUrl": "https://…",
  "publicUrl": "https://media.mediasaver.si/…",
  "expiresIn": 600,
  "headers": { "Content-Type": "video/mp4" }
}`;

const UPLOAD_STEP_2 = `curl -X PUT "UPLOAD_URL_FROM_STEP_1" \\
  -H "Content-Type: video/mp4" \\
  --data-binary @demo.mp4`;

const UPLOAD_STEP_3 = `curl -X POST ${BASE_URL}/posts \\
  -H "Authorization: Bearer ms_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"uploadId":"UPLOAD_ID_FROM_STEP_1","channelIds":["FIRST_CHANNEL_ID","SECOND_CHANNEL_ID"],"text":"We just shipped it."}'`;

function CodeBlock({ children, response = false }: { children: string; response?: boolean }) {
  return (
    <pre
      className={`overflow-x-auto border border-line bg-surface p-5 font-mono text-[13px] leading-[1.8] ${
        response ? 'text-terracotta' : ''
      }`}
    >
      {children}
    </pre>
  );
}

function MethodTag({ method }: { method: 'GET' | 'POST' }) {
  return (
    <span
      className={`px-[9px] py-1 text-xs font-semibold text-ink ${
        method === 'POST' ? 'bg-terracotta' : 'bg-olive-text'
      }`}
    >
      {method}
    </span>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-4xl font-light">{children}</h2>;
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-[13px] text-paper">{children}</code>;
}

export default function DocsPage() {
  return (
    <>
      <SiteHeader active="docs" />

      <div className="mx-auto grid max-w-6xl gap-16 px-6 md:px-8 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-8 flex flex-col pt-[88px] text-sm">
            <span className="pb-3.5 text-[13px] text-muted">On this page</span>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="border-l border-line py-2 pl-3.5 text-muted hover:border-terracotta hover:text-paper"
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>

        <article className="flex min-w-0 max-w-[800px] flex-col gap-[72px] pb-32 pt-20">
          <section id="quick-start" className="flex scroll-mt-8 flex-col gap-5">
            <h1 className="font-serif text-5xl font-light leading-none tracking-[-0.02em] md:text-6xl">
              The Media Saver API
            </h1>
            <p className="max-w-[600px] text-base leading-[1.7] text-muted">
              One request uploads your image or video and creates the post on one or more channels in your
              Buffer account. Media Saver keeps the file online until Buffer has published every post, then
              deletes it.
            </p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 leading-[1.7] text-muted">
              <li>
                <a href="/api/auth/login" className="text-paper underline">Connect your Buffer account</a>.
              </li>
              <li>Create an API key on your dashboard.</li>
              <li>Copy a channel ID from your dashboard, or list them with GET /channels.</li>
              <li>Send your first post with the request below.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-3 border-y border-line py-3.5 text-[13px]">
              <span className="text-muted">Base URL</span>
              <code className="font-mono text-paper">{BASE_URL}</code>
            </div>
          </section>

          <section id="authentication" className="flex scroll-mt-8 flex-col gap-4">
            <SectionHeading>Authentication</SectionHeading>
            <p className="leading-[1.7] text-muted">
              Send your API key in the Authorization header of every request. Keep it secret. If a key leaks,
              revoke it on your dashboard and create a new one: the old key stops working immediately.
            </p>
            <CodeBlock>{AUTH_EXAMPLE}</CodeBlock>
          </section>

          <section id="key-safety" className="flex scroll-mt-8 flex-col gap-4">
            <SectionHeading>Keeping keys safe</SectionHeading>
            <ul className="flex list-disc flex-col gap-3 pl-5 leading-[1.7] text-muted">
              <li>
                Create one key per automation, named after it, such as “n8n weekly posts”. If one is exposed, you
                revoke only that key, and everything else keeps working.
              </li>
              <li>
                Store keys in your tool’s credential manager, such as n8n credentials, Zapier connections or your
                hosting provider’s environment variables. Never paste them into code, shared documents or screenshots.
              </li>
              <li>
                Where your tool allows it, limit the credential to mediasaver.si, so it is never sent anywhere else.
                n8n calls this “Allowed HTTP Request Domains”.
              </li>
              <li>
                To rotate a key, create the new one, update your automation to use it, check it works, then revoke the
                old one. Nothing stops in between.
              </li>
              <li>
                Rotate straight away if a key may have been exposed, or when someone with access leaves your team.
                Otherwise, rotating every few months is good practice.
              </li>
              <li>
                Check the “last used” date on your dashboard now and then. A key that hasn’t been used for weeks is
                probably not needed, so revoke it.
              </li>
            </ul>
          </section>

          <section id="create-post" className="flex scroll-mt-8 flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-4">
              <MethodTag method="POST" />
              <SectionHeading>/posts</SectionHeading>
            </div>
            <p className="leading-[1.7] text-muted">
              Uploads an image or video and creates the post in Buffer. Send it as multipart form data.
            </p>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="py-3.5 pr-4 font-medium">Field</th>
                    <th className="p-3.5 font-medium">Required</th>
                    <th className="py-3.5 pl-4 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {POST_FIELDS.map((field) => (
                    <tr key={field.name} className="border-t border-line last:border-b">
                      <td className="py-3.5 pr-4 font-mono text-[13px]">{field.name}</td>
                      <td className="p-3.5">{field.required}</td>
                      <td className="py-3.5 pl-4 text-muted">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CodeBlock>{POST_EXAMPLE}</CodeBlock>
            <p className="text-[13px] text-muted">Response: 201 Created</p>
            <CodeBlock response>{POST_RESPONSE}</CodeBlock>
            <p className="leading-[1.7] text-muted">
              The file stays online until Buffer reports every post as published, then a daily cleanup deletes
              it. You never need to delete files yourself. If you delete a post in Buffer, the file is cleaned up
              too.
            </p>
          </section>

          <section id="multiple-channels" className="flex scroll-mt-8 flex-col gap-[18px]">
            <SectionHeading>Multiple channels</SectionHeading>
            <p className="leading-[1.7] text-muted">
              To post the same file to several channels, repeat the <Code>channelId</Code> field, up to 10 times.
              With JSON, send a <Code>channelIds</Code> list instead. The file is uploaded once and shared by
              every post.
            </p>
            <CodeBlock>{MULTI_EXAMPLE}</CodeBlock>
            <p className="leading-[1.7] text-muted">
              Each channel is handled separately, so one channel failing doesn’t stop the others. The response
              lists the posts that were created in <Code>posts</Code>, and any channel that failed, with Buffer’s
              reason, in <Code>errors</Code>. Check <Code>errors</Code> before assuming every channel worked. The
              top-level <Code>postId</Code>, <Code>status</Code> and <Code>dueAt</Code> describe the first post,
              so single-channel integrations keep working unchanged.
            </p>
            <p className="text-[13px] text-muted">A partly successful response: 201 Created</p>
            <CodeBlock response>{PARTIAL_RESPONSE}</CodeBlock>
          </section>

          <section id="large-files" className="flex scroll-mt-8 flex-col gap-[18px]">
            <SectionHeading>Large files and video</SectionHeading>
            <p className="leading-[1.7] text-muted">
              For images up to 20 MB and MP4 videos up to 100 MB, upload the file directly to storage in three
              steps. The file never passes through Media Saver’s servers, so the 4 MB limit does not apply.
            </p>
            <p className="leading-[1.7] text-muted">
              1. Ask for an upload address, giving the file’s name, type and exact size in bytes.
            </p>
            <CodeBlock>{UPLOAD_STEP_1}</CodeBlock>
            <CodeBlock response>{UPLOAD_STEP_1_RESPONSE}</CodeBlock>
            <p className="leading-[1.7] text-muted">
              2. Upload the file to uploadUrl within 10 minutes, with the headers from step 1. Do not send your API
              key: the address carries its own permission.
            </p>
            <CodeBlock>{UPLOAD_STEP_2}</CodeBlock>
            <p className="leading-[1.7] text-muted">
              3. Create the post with the uploadId, using JSON. Media Saver checks the file arrived before sending
              it to Buffer.
            </p>
            <CodeBlock>{UPLOAD_STEP_3}</CodeBlock>
            <p className="leading-[1.7] text-muted">
              An upload address that is never used is cleaned up automatically after 7 days.
            </p>
          </section>

          <section id="networks" className="flex scroll-mt-8 flex-col gap-4">
            <SectionHeading>Network notes</SectionHeading>
            <ul className="flex list-disc flex-col gap-3 pl-5 leading-[1.7] text-muted">
              <li>
                <span className="text-paper">Instagram:</span> images are published as feed posts, and videos as
                reels that also appear on your profile grid. Reels must be vertical (9:16) and between 3 seconds
                and 15 minutes long.
              </li>
              <li>
                <span className="text-paper">Every network</span> applies its own rules for text length, image
                proportions and video length. If a network rejects a post, the error message passes on Buffer’s
                reason.
              </li>
            </ul>
          </section>

          <section id="list-channels" className="flex scroll-mt-8 flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-4">
              <MethodTag method="GET" />
              <SectionHeading>/channels</SectionHeading>
            </div>
            <p className="leading-[1.7] text-muted">
              Lists the channels in your Buffer account with their IDs and networks, so your automation knows
              where to post. Results are cached for up to 10 minutes.
            </p>
            <CodeBlock>{CHANNELS_EXAMPLE}</CodeBlock>
            <p className="text-[13px] text-muted">Response: 200 OK</p>
            <CodeBlock response>{CHANNELS_RESPONSE}</CodeBlock>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <MethodTag method="POST" />
              <SectionHeading>/channels</SectionHeading>
            </div>
            <p className="leading-[1.7] text-muted">
              Fetches a fresh list from Buffer, for example right after you connect a new channel. It returns the
              same response as GET. To protect your rate limit, refreshes within 30 seconds of the last one return
              the saved list.
            </p>
            <CodeBlock>{CHANNELS_REFRESH_EXAMPLE}</CodeBlock>
          </section>

          <section id="errors" className="flex scroll-mt-8 flex-col gap-4">
            <SectionHeading>Errors</SectionHeading>
            <p className="leading-[1.7] text-muted">
              Every error returns JSON with an error message you can show or log.
            </p>
            <CodeBlock>{ERROR_RESPONSE}</CodeBlock>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <tbody>
                  {ERRORS.map((error) => (
                    <tr key={error.code} className="border-b border-line">
                      <td className="w-[72px] py-[13px] pr-4 font-mono text-[13px]">{error.code}</td>
                      <td className="py-[13px] text-muted">{error.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="rate-limits" className="flex scroll-mt-8 flex-col gap-4">
            <SectionHeading>Rate limits</SectionHeading>
            <p className="leading-[1.7] text-muted">
              Requests to Buffer count against a shared quota, and each channel in a post counts as one request.
              If you receive a 429, wait for the number of seconds in the Retry-After header before trying again,
              and avoid automatic retry loops in your workflows.
            </p>
          </section>

          <section id="n8n" className="flex scroll-mt-8 flex-col gap-4 bg-olive p-6 md:p-9">
            <SectionHeading>Using n8n</SectionHeading>
            <ol className="flex list-decimal flex-col gap-3 pl-5 leading-[1.7] text-olive-text">
              <li>
                Create a <span className="font-semibold text-paper">Header Auth</span> credential with the name
                Authorization and the value Bearer followed by your key. Set its allowed domains to mediasaver.si.
              </li>
              <li>
                Get your file as binary data, for example with an HTTP Request node whose response format is File,
                or a Google Drive download node. Both put the file in a field called data.
              </li>
              <li>
                Add an <span className="font-semibold text-paper">HTTP Request</span> node: method POST, URL{' '}
                {BASE_URL}/posts, authentication Header Auth with your credential.
              </li>
              <li>
                Set the body to Form-Data. Add file as an n8n Binary File with the input field data, then channelId
                (once per channel), text and, for a set time, dueAt as form fields.
              </li>
            </ol>
            {N8N_WORKFLOW_URL && (
              <p className="leading-[1.7] text-olive-text">
                Or{' '}
                <a href={N8N_WORKFLOW_URL} download className="text-paper underline">
                  download the ready-made workflow
                </a>{' '}
                and import it into n8n.
              </p>
            )}
          </section>
        </article>
      </div>

      <SiteFooter />
    </>
  );
}
