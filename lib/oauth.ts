import { randomBytes, createHash } from 'node:crypto';

export const BUFFER_AUTH_URL = 'https://auth.buffer.com/auth';
export const BUFFER_TOKEN_URL = 'https://auth.buffer.com/token';
export const BUFFER_SCOPES = 'account:read posts:read posts:write offline_access';

export function generateRandomString(){
    return randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(Verifier: string) {
    return createHash('sha256').update(Verifier).digest('base64url');
}
