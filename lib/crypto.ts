import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function getKey() {
    const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY ?? '', 'base64');
    if (key.length !== 32) {
        throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded ');
    }
    return key;
}

export function encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, encrypted].map((part) => part.toString('base64')).join('.');
}

export function decrypt(payload: string): string {
    const [iv, authTag, encrypted] = payload.split('.').map((part) => Buffer.from(part, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'); 
}