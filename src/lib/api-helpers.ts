/**
 * Shared API route helpers — auth guard, response shaping, regex escaping.
 * Reduces boilerplate duplicated across 15+ route handlers.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
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
  // Try NextAuth's built-in auth() first
  const session = await auth();
  if (session?.user) {
    return session.user as AuthenticatedUser;
  }

  // Fallback: manually decode the session cookie (handles custom login endpoint)
  const cookieStore = await cookies();
  const raw =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value;
  if (raw) {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (secret) {
      const cookieName =
        cookieStore.get("__Secure-authjs.session-token")
          ? "__Secure-authjs.session-token"
          : "authjs.session-token";
      try {
        const token = await decode({ token: raw, secret, salt: cookieName });
        if (token?.id) {
          return {
            id: token.id as string,
            email: token.email as string | null,
            name: token.name as string | null,
            role: token.role as string,
          };
        }
      } catch {
        // decode failed — fall through to 401
      }
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// ── Multi-tenancy: consultant scope helpers ───────────────────

/**
 * Returns a MongoDB filter fragment that scopes a query to the consultant's
 * own records. Pass into Client.find() / Prospect.find() directly.
 * - admin (no impersonation) → {} (no restriction)
 * - admin impersonating a consultant → { assignedConsultant: <impersonated id> }
 * - consultant → { assignedConsultant: user.id }
 */
export async function consultantFilter(
  user: AuthenticatedUser
): Promise<Record<string, unknown>> {
  if (user.role === "consultant") return { assignedConsultant: user.id };
  // Admin: check if impersonating a consultant
  const cookieStore = await cookies();
  const viewAsId = cookieStore.get("view-as-consultant-id")?.value;
  if (viewAsId) return { assignedConsultant: viewAsId };
  return {};
}

/**
 * Verifies a consultant owns the given client (via assignedConsultant).
 * Admins always pass. Returns a 403 NextResponse if access is denied.
 *
 * Usage:
 *   const check = assertConsultantOwnsClient(user, client as Record<string, unknown>);
 *   if (check) return check;
 */
export function assertConsultantOwnsClient(
  user: AuthenticatedUser,
  client: Record<string, unknown>
): NextResponse | null {
  if (user.role === "admin") return null;
  if (user.role === "consultant") {
    const ac = client.assignedConsultant as Record<string, unknown> | string | null | undefined;
    const ownerId = ac && typeof ac === "object" ? String(ac._id) : String(ac ?? "");
    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}

/**
 * assertClientAccess — checks that the calling user can access a specific clientId.
 * - admin: always allowed
 * - consultant: must be the assignedConsultant on that client
 * - client: must be the userId or a teamUserId on that client
 * Returns a 403/404 NextResponse if denied, null if allowed.
 */
export async function assertClientAccess(
  user: AuthenticatedUser,
  clientId: string
): Promise<NextResponse | null> {
  if (user.role === "admin") return null;
  const { default: Client } = await import("@/models/Client");
  const client = await Client.findById(clientId)
    .select("userId teamUserIds assignedConsultant")
    .lean() as Record<string, unknown> | null;
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  if (user.role === "client") {
    const isOwner =
      String(client.userId) === user.id ||
      ((client.teamUserIds as string[]) ?? []).some((id) => String(id) === user.id);
    if (!isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "consultant") {
    if (String(client.assignedConsultant) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
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
