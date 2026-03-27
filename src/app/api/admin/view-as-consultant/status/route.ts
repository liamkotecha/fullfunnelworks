export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const consultantId = cookieStore.get("view-as-consultant-id")?.value ?? null;
  return NextResponse.json({ consultantId });
}
