import { getIronSession, SessionOptions } from "iron-session";  
import { cookies } from "next/headers";

export type SessionData = {
    oauthState?: string;
    codeVerifier?: string;
    userId?: string;
};

const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET!,
    cookieName: "media_saver_session",
    cookieOptions: {
        secure: true,
        httpOnly: true,
        sameSite: "lax",    
    },
};

export async function getSession() {
    return getIronSession<SessionData>(await cookies(), sessionOptions);
}