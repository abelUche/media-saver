import { createHash, randomBytes } from 'node:crypto';

const KEY_PREFIX = 'ms_live_';

export function hashApiKey(key: string) {
  return createHash('sha256').update(key).digest('hex');
}

export function generateApiKey() {
  const key = KEY_PREFIX + randomBytes(24).toString('base64url');
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, KEY_PREFIX.length + 4),
  };
}