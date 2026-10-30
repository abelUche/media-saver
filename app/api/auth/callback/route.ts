import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { BUFFER_TOKEN_URL } from '@/lib/oauth';
import { encrypt } from '@/lib/crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const session = await getSession();
  const { oauthState, codeVerifier } = session;

  session.oauthState = undefined;
  session.codeVerifier = undefined;
  await session.save();

  if (!state || !oauthState || state !== oauthState || !codeVerifier) {
    return new Response('Invalid state parameter. Please try logging in again.', { status: 400 });
  }

  if (error || !code) {
    redirect(`/?error=${encodeURIComponent(error ?? 'missing_code')}`);
  }

  const tokenResponse = await fetch(BUFFER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.BUFFER_CLIENT_ID!,
      client_secret: process.env.BUFFER_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.BUFFER_REDIRECT_URI!,
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    console.error('Token exchange failed:', await tokenResponse.text());
    redirect('/?error=token_exchange_failed');
  }

  const tokens: TokenResponse = await tokenResponse.json();

  if (!tokens.refresh_token) {
    console.error('No refresh token returned. Is offline_access in the scopes?');
    redirect('/?error=no_refresh_token');
  }

  const accountResponse = await fetch('https://api.buffer.com', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: '{ account { id } }' }),
  });
  const accountResult = await accountResponse.json();
  const bufferAccountId: string | undefined = accountResult?.data?.account?.id;

  if (!bufferAccountId) {
    console.error('Could not read Buffer account:', JSON.stringify(accountResult));
    redirect('/?error=account_lookup_failed');
  }

  const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const accessToken = encrypt(tokens.access_token);
  const refreshToken = encrypt(tokens.refresh_token);

  const [user] = await db
    .insert(users)
    .values({ bufferAccountId, accessToken, refreshToken, tokenExpiresAt })
    .onConflictDoUpdate({
      target: users.bufferAccountId,
      set: { accessToken, refreshToken, tokenExpiresAt },
    })
    .returning({ id: users.id });

  session.userId = user.id;
  await session.save();

  redirect('/');
}