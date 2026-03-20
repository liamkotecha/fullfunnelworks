/**
 * Shared API route helpers — auth guard, response shaping, regex escaping.
 * Reduces boilerplate duplicated across 15+ route handlers.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { ClientDTO } from "@/types";

// ── Auth ─────────────────────────────────────────────────────

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
}

/**
 * Require an authenticated session. Returns the user object or a 401 Response.
 * Usage:
 *   const userOrRes = await requireAuth();
 *   if (userOrRes instanceof NextResponse) return userOrRes;
 *   const user = userOrRes;
 */
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user as AuthenticatedUser;
}

// ── Client DTO mapping ───────────────────────────────────────

/**
 * Convert a populated Mongoose Client lean doc to a typed ClientDTO.
 * Extracts email/name from the populated userId reference.
 */
export function toClientDTO(doc: Record<string, any>): Omit<ClientDTO, "overallProgress"> {
  return {
    ...doc,
    _id: String(doc._id),
    id: String(doc._id),
    email: doc.userId?.email ?? "",
    name: doc.userId?.name ?? "",
  } as Omit<ClientDTO, "overallProgress">;
}

// ── Regex ────────────────────────────────────────────────────

/**
 * Escape a string for safe use in a RegExp.
 * Prevents ReDoS from user-supplied regex metacharacters.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Error wrapper ────────────────────────────────────────────

/**
 * Wrap an async handler with try/catch, returning structured JSON errors.
 */
export function apiError(label: string, error: unknown, status = 500): NextResponse {
  console.error(`[${label}]`, error);
  return NextResponse.json({ error: `Failed: ${label}` }, { status });
}

// ── View As (Portal client resolution) ───────────────────────

/**
 * resolvePortalClient — resolves which clientId to use for portal API calls.
 *
 * Normal mode: import Client and query via userId/teamUserIds
 * View As mode: reads view-as-client-id cookie, verifies admin/consultant, returns that clientId
 *
 * Returns { clientId, isViewAs } or null if no client found.
 */
export async function resolvePortalClient(
  user: AuthenticatedUser,
  req: NextRequest
): Promise<{ clientId: string; isViewAs: boolean } | null> {
  const viewAsCookie = req.cookies.get("view-as-client-id")?.value;

  if (viewAsCookie && (user.role === "admin" || user.role === "consultant")) {
    // Dynamic import to avoid circular dependency
    const { default: Client } = await import("@/models/Client");
    const client = await Client.findById(viewAsCookie).select("_id").lean();
    if (client) {
      return { clientId: String((client as Record<string, unknown>)._id), isViewAs: true };
    }
  }

  // Normal resolution: find by userId or teamUserIds
  const { default: Client } = await import("@/models/Client");
  let client = await Client.findOne({
    $or: [{ userId: user.id }, { teamUserIds: user.id }],
  })
    .select("_id")
    .lean() as Record<string, unknown> | null;

  // Admin fallback
  if (!client && user.role === "admin") {
    client = await Client.findOne()
      .sort({ createdAt: 1 })
      .select("_id")
      .lean() as Record<string, unknown> | null;
  }

  if (!client) return null;
  return { clientId: String(client._id), isViewAs: false };
}
