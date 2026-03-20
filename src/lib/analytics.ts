/**
 * GA4 EVENT REFERENCE
 * ===================
 *
 * Server-side events (Measurement Protocol — require gaClientId):
 *
 *   generate_lead          — lead received via web form webhook
 *   lead_qualified         — prospect moved to SQL stage
 *   proposal_sent          — prospect moved to proposal stage
 *   deal_won               — prospect marked as won
 *   deal_lost              — prospect marked as lost
 *   purchase               — prospect converted to client
 *   invoice_paid           — Stripe invoice.paid webhook received
 *
 * Client-side events (gtag — fire from browser):
 *
 *   assessment_started     — first response saved in any assessment section
 *   section_completed      — subsection reaches 100% completion
 *   module_completed       — all subsections in a module reach 100%
 *   report_downloaded      — client downloads their PDF report
 *   portal_page_view       — client navigates to a portal page
 *
 * GA4 recommended event names used where applicable:
 *   generate_lead, purchase — standard GA4 names for better reporting
 */

// ── Client-side ──────────────────────────────────────────────

/**
 * trackEvent — fire a GA4 event from the browser.
 * Safe to call even if GA4 is not configured — checks for gtag existence first.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  try {
    if (typeof window === "undefined") return;
    if (typeof (window as unknown as Record<string, unknown>).gtag !== "function") return;
    (window as unknown as Record<string, (...args: unknown[]) => void>).gtag(
      "event",
      eventName,
      params ?? {}
    );
  } catch {
    // silent
  }
}

// ── Server-side ──────────────────────────────────────────────

export interface ServerEventPayload {
  measurementId: string;
  apiSecret: string;
  clientId: string;
  sessionId?: string;
  eventName: string;
  params?: Record<string, string | number | boolean | object>;
}

/**
 * trackServerEvent — send a GA4 event via Measurement Protocol.
 * Non-blocking — call without await in API routes.
 *
 * Endpoint: https://www.google-analytics.com/mp/collect
 */
export async function trackServerEvent(
  payload: ServerEventPayload
): Promise<void> {
  try {
    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${payload.measurementId}&api_secret=${payload.apiSecret}`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: payload.clientId,
        events: [
          {
            name: payload.eventName,
            params: {
              session_id: payload.sessionId,
              engagement_time_msec: "1",
              ...(payload.params ?? {}),
            },
          },
        ],
      }),
    });
  } catch {
    // silent
  }
}

// ── GA4 Settings Cache ───────────────────────────────────────

export interface GA4Config {
  measurementId: string;
  apiSecret: string;
  trackedEvents: Record<string, boolean>;
}

let settingsCache: { data: GA4Config | null; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * getGA4Settings — fetches GA4 config from Settings model.
 * Cached module-level for 5 minutes to avoid DB hit on every request.
 * Returns null if GA4 not configured or disabled.
 */
export async function getGA4Settings(): Promise<GA4Config | null> {
  const now = Date.now();
  if (settingsCache && now - settingsCache.fetchedAt < CACHE_TTL_MS) {
    return settingsCache.data;
  }

  try {
    // Dynamic import to avoid circular dependency in client contexts
    const { default: Settings } = await import("@/models/Settings");
    const { connectDB } = await import("@/lib/db");
    await connectDB();

    const settings = (await Settings.findOne().lean()) as Record<
      string,
      unknown
    > | null;

    if (
      !settings ||
      !settings.ga4Enabled ||
      !settings.ga4MeasurementId ||
      !settings.ga4ApiSecret
    ) {
      settingsCache = { data: null, fetchedAt: now };
      return null;
    }

    const trackedEvents = (settings.ga4TrackedEvents as Record<string, boolean>) ?? {};

    const config: GA4Config = {
      measurementId: String(settings.ga4MeasurementId),
      apiSecret: String(settings.ga4ApiSecret),
      trackedEvents: {
        leadReceived: trackedEvents.leadReceived ?? true,
        leadQualified: trackedEvents.leadQualified ?? true,
        proposalSent: trackedEvents.proposalSent ?? true,
        dealWon: trackedEvents.dealWon ?? true,
        dealLost: trackedEvents.dealLost ?? false,
        clientConverted: trackedEvents.clientConverted ?? true,
        assessmentStarted: trackedEvents.assessmentStarted ?? true,
        sectionCompleted: trackedEvents.sectionCompleted ?? false,
        moduleCompleted: trackedEvents.moduleCompleted ?? true,
        invoicePaid: trackedEvents.invoicePaid ?? true,
        reportDownloaded: trackedEvents.reportDownloaded ?? false,
      },
    };

    settingsCache = { data: config, fetchedAt: now };
    return config;
  } catch {
    // On error, cache null for 1 minute to avoid hammering
    settingsCache = { data: null, fetchedAt: now - CACHE_TTL_MS + 60_000 };
    return null;
  }
}
