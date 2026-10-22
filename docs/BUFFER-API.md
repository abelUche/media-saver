# Buffer API reference for Media Saver

Queries tested by hand in the Buffer API Explorer on 22 October 2026, with real responses.
Put this file at `docs/BUFFER-API.md` in the repo.

- Endpoint: `POST https://api.buffer.com` (GraphQL, always HTTP 200; errors are in the response body)
- Header: `Authorization: Bearer <token>` (personal API key for testing; the user's OAuth access token in the app)
- Explorer: https://developers.buffer.com/explorer.html

## Test account IDs (not secret)

| What | ID |
|---|---|
| Organisation ("My Organization") | `6a8f0d20014f5e191ee08082` |
| Channel `uche-abel` (LinkedIn) | `6ad9a464778b240e2f87c828` |
| Channel `abelvika` (LinkedIn) | `6ad9a464778b240e2f87c827` |

## Rules learned

- Declare variables in the top line: `query Name($a: TypeA!, $b: TypeB!)`. The `!` means required.
- Use variables without quotes in the query (`url: $imageUrl`). Put values in quotes in the JSON Variables panel.
- Every variable name in the query must match a key in the Variables JSON. Don't send variables the query doesn't declare.
- Always include `... on MutationError { message }` in mutations so every error comes back readable.
- `saveToDraft: true` creates a draft that is never published. Use it for all tests on real channels.
- Types confirmed: `OrganizationId`, `ChannelId`, `PostId`, `String` (for the image URL).

---

## 1. Get the organisation

Used right after a user logs in, to find which organisation to work in.

```graphql
query GetOrganizations {
  account {
    organizations {
      id
      name
    }
  }
}
```

Response:

```json
{
  "data": {
    "account": {
      "organizations": [
        { "id": "6a8f0d20014f5e191ee08082", "name": "My Organization" }
      ]
    }
  }
}
```

## 2. List channels

Used to show the user which channels they can post to. Cache the result for the session to save requests.

```graphql
query GetChannels($organizationId: OrganizationId!) {
  channels(input: { organizationId: $organizationId }) {
    id
    name
    service
  }
}
```

Variables:

```json
{ "organizationId": "6a8f0d20014f5e191ee08082" }
```

Response:

```json
{
  "data": {
    "channels": [
      { "id": "6ad9a464778b240e2f87c828", "name": "uche-abel", "service": "linkedin" },
      { "id": "6ad9a464778b240e2f87c827", "name": "abelvika", "service": "linkedin" }
    ]
  }
}
```

## 3. Create a text-only draft

`createPost` needs only the channel ID, not the organisation ID. Buffer works out the organisation from the channel.

```graphql
mutation CreateDraftPost($channelId: ChannelId!, $text: String!) {
  createPost(input: {
    text: $text
    channelId: $channelId
    schedulingType: automatic
    mode: addToQueue
    saveToDraft: true
  }) {
    ... on PostActionSuccess {
      post { id text status dueAt }
    }
    ... on MutationError {
      message
    }
  }
}
```

Variables:

```json
{
  "channelId": "6ad9a464778b240e2f87c827",
  "text": "Test draft from the Buffer API. Not for publishing."
}
```

Response: `status: "draft"`, `dueAt: null` (drafts have no publish time).

## 4. Create a draft with an image from R2 (the core of Media Saver)

```graphql
mutation CreateImageDraft($channelId: ChannelId!, $text: String!, $imageUrl: String!) {
  createPost(input: {
    text: $text
    channelId: $channelId
    schedulingType: automatic
    mode: addToQueue
    saveToDraft: true
    assets: [{ image: { url: $imageUrl } }]
  }) {
    ... on PostActionSuccess {
      post {
        id
        text
        status
        assets { id mimeType }
      }
    }
    ... on MutationError {
      message
    }
  }
}
```

Variables:

```json
{
  "channelId": "6ad9a464778b240e2f87c827",
  "text": "Test image draft from the Buffer API. Not for publishing.",
  "imageUrl": "https://pub-1b8ecb56e1e246899b41ee32660e3af3.r2.dev/IMG_6344.jpeg"
}
```

Response: `mimeType: "image/jpeg"`, asset `id: null`.

What this proves and what it means for the app:

- Buffer fetches the image from R2 **when the post is created**. If it can't, the mutation returns an error such as "Failed to fetch image dimensions: Not Found".
- Buffer fetches it **again when the post publishes**, possibly days later. So files must stay in R2 until the post is sent. Never delete at creation time.
- Asset IDs come back `null` on drafts. Don't rely on them; track files by `r2_key` and `buffer_post_id`.
- For production posts (not tests): remove `saveToDraft`, and use `mode: customScheduled` with `dueAt: "<ISO 8601 UTC>"` for a specific time, or `mode: addToQueue` for the next slot.

## 5. Check a post's status (used by the cleanup job)

```graphql
query GetPost($postId: PostId!) {
  post(input: { id: $postId }) {
    id
    status
    dueAt
    sentAt
  }
}
```

Variables:

```json
{ "postId": "6ada18d0f09f431dcae16d36" }
```

Response (for a draft): `status: "draft"`, `dueAt: null`, `sentAt: null`.

Cleanup job decisions, for each `uploads` row with status `scheduled`:

| Buffer status | Action |
|---|---|
| `scheduled` | Leave the file. Skip checking until after `dueAt`. |
| `sent` (with `sentAt`) | Delete the file from R2, mark the row `deleted`, set `deleted_at`. |
| `error` | Keep the file (the user may retry). Mark the row `failed`. |
| Post not found (deleted in Buffer) | To confirm when building: likely safe to delete the file. |

## Rate limits

Each API key and each app client has its own quota. Testing with the personal key does not use up Media Saver's app client quota. The app client's free-tier limits (100 per 15 min, 250 per 24 h, 3,000 per 30 days) are shared by all users and the judges, so cache organisation and channel lists, and don't check posts before their `dueAt`.
