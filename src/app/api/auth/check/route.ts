export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { decode } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  // Log all cookies
  const cookies = req.cookies.getAll().map(c => ({ name: c.name, length: c.value.length }));
  
  // Try default getToken
  let defaultResult: unknown = null;
  let defaultError: string | null = null;
  try {
    defaultResult = await getToken({ req, secret });
  } catch (e) {
    defaultError = (e as Error).message;
  }

  // Try with explicit salt matching what we used in encode
  const isSecure = req.url.startsWith("https");
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  
  let saltResult: unknown = null;
  let saltError: string | null = null;
  try {
    saltResult = await getToken({ req, secret, salt: cookieName, cookieName });
  } catch (e) {
    saltError = (e as Error).message;
  }

  // Try manual decode of the raw cookie value
  const rawCookie = req.cookies.get("__Secure-authjs.session-token")?.value 
    || req.cookies.get("authjs.session-token")?.value;
  
  let manualDecode: unknown = null;
  let manualError: string | null = null;
  if (rawCookie && secret) {
    // Try different salt values
    const salts = ["__Secure-authjs.session-token", "authjs.session-token", ""];
    for (const s of salts) {
      try {
        manualDecode = await decode({ token: rawCookie, secret, salt: s });
        if (manualDecode) {
          manualError = `worked with salt="${s}"`;
          break;
        }
      } catch (e) {
        manualError = `salt="${s}" failed: ${(e as Error).message}`;
      }
    }
  }

  return NextResponse.json({
    cookies,
    isSecure,
    cookieName,
    rawCookieLength: rawCookie?.length ?? 0,
    defaultGetToken: { result: defaultResult, error: defaultError },
    saltGetToken: { result: saltResult, error: saltError },
    manualDecode: { result: manualDecode, error: manualError },
  });
}
