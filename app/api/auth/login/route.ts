import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
    BUFFER_AUTH_URL,
    BUFFER_SCOPES,
    generateCodeChallenge,
    generateRandomString,
} from "@/lib/oauth";

export async function GET() {
    const state = generateRandomString();
    const codeVerifier = generateRandomString();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const session = await getSession();
    session.oauthState = state;
    session.codeVerifier = codeVerifier;
    await session.save();

    const params = new URLSearchParams({
        client_id: process.env.BUFFER_CLIENT_ID!,
        redirect_uri: process.env.BUFFER_REDIRECT_URI!,
        response_type: "code",
        scope: BUFFER_SCOPES,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        prompt: "consent",
    });

    redirect(`${BUFFER_AUTH_URL}?${params.toString()}`);
}