export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  
  // Log all cookies for debugging
  const cookies = req.cookies.getAll().map(c => ({ name: c.name, length: c.value.length }));
  
  const token = await getToken({ req, secret });
  
  return NextResponse.json({
    authenticated: !!token,
    tokenPayload: token ? { id: token.id, email: token.email, role: token.role } : null,
    cookies,
  });
}
