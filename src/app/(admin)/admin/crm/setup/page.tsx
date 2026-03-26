"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications/ToastContext";

const FIELD_TABLE = [
  { id: "field_business_name", label: "Company Name", required: true, type: "Text" },
  { id: "field_contact_name", label: "Your Name", required: true, type: "Text" },
  { id: "field_email", label: "Email Address", required: true, type: "Email" },
  { id: "field_phone", label: "Phone Number", required: false, type: "Tel" },
  { id: "field_website", label: "Website", required: false, type: "URL" },
  { id: "field_company_size", label: "Company Size", required: false, type: "Dropdown" },
  { id: "field_revenue_range", label: "Annual Revenue", required: false, type: "Dropdown" },
  { id: "field_challenge", label: "Primary Challenge", required: false, type: "Textarea" },
  { id: "field_hear_about", label: "How did you hear about us?", required: false, type: "Text" },
  { id: "field_message", label: "Message", required: false, type: "Textarea" },
  { id: "field_ga_client_id", label: "(hidden)", required: false, type: "Hidden" },
  { id: "field_referrer_url", label: "(hidden)", required: false, type: "Hidden" },
];

const inputCls =
  "w-full px-3 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all";

export default function CrmSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as { role?: string })?.role !== "admin") router.replace("/admin/dashboard");
  }, [session, status, router]);

  const { success, error: toastError } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    const baseUrl = window.location.origin;
    const key = process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? "your-secret-here";
    setWebhookUrl(`${baseUrl}/api/webhooks/lead?key=${key}`);
  }, []);

  const maskedUrl = webhookUrl.replace(/key=.*$/, "key=••••••••");

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [webhookUrl]);

  const testWebhook = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_business_name: "Test Company Ltd",
          field_contact_name: "Test User",
          field_email: "test@example.com",
          field_phone: "+44 7700 900000",
          field_website: "https://example.com",
          field_company_size: "11-50",
          field_revenue_range: "500k-2m",
          field_challenge: "We need help scaling our sales process",
          field_hear_about: "Google",
          field_message: "This is a test submission from the CRM setup page.",
        }),
      });
      if (res.ok) {
        setTestResult("success");
        success("Test webhook sent", "Check your CRM pipeline for the test lead.");
      } else {
        setTestResult("error");
        toastError("Webhook returned an error", `Status: ${res.status}`);
      }
    } catch {
      setTestResult("error");
      toastError("Webhook test failed", "Could not reach the endpoint.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-bold text-2xl text-slate-900">CRM Setup</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure your WordPress/Elementor form to send leads to the portal
        </p>
      </div>

      {/* Step 1: Webhook URL */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            1
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Copy your webhook URL</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              This is the endpoint your Elementor form will POST data to.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg font-mono truncate">
            {showKey ? webhookUrl : maskedUrl}
          </div>
          <button
            onClick={() => setShowKey((v) => !v)}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title={showKey ? "Hide key" : "Reveal key"}
          >
            {showKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={copyUrl}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </section>

      {/* Step 2: Field mapping table */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            2
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Configure Elementor form fields</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Your form must include fields with these exact IDs:
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Field ID</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Suggested Label</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Required</th>
                <th className="px-4 py-2.5 font-medium text-slate-500 text-xs uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FIELD_TABLE.map((f) => (
                <tr key={f.id} className={cn(f.required && "bg-blue-50/30")}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{f.id}</td>
                  <td className="px-4 py-2 text-slate-600">{f.label}</td>
                  <td className="px-4 py-2">
                    {f.required ? (
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Yes</span>
                    ) : (
                      <span className="text-xs text-slate-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{f.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Step 3: Hidden fields for GA4 */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            3
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Add hidden fields for GA4 tracking</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Add two hidden fields with these custom JS values:
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">field_ga_client_id — GA4 Client ID</p>
            <pre className="px-4 py-3 bg-slate-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto">
{`(function() {
  try {
    var match = document.cookie.match(/_ga=([^;]+)/);
    if (!match) return '';
    var parts = match[1].split('.');
    return parts.slice(-2).join('.');
  } catch(e) { return ''; }
})()`}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">field_referrer_url — Referrer URL</p>
            <pre className="px-4 py-3 bg-slate-900 text-green-400 text-xs font-mono rounded-lg overflow-x-auto">
{`(function() {
  try { return document.referrer || ''; }
  catch(e) { return ''; }
})()`}
            </pre>
          </div>
        </div>
      </section>

      {/* Step 4: Configure webhook action */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            4
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Configure the webhook action</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              In your Elementor form settings:
            </p>
          </div>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 ml-10">
          <li>Go to <strong>Actions After Submit</strong> → <strong>Add Action</strong> → <strong>Webhook</strong></li>
          <li>Paste your webhook URL from Step 1</li>
          <li>Set Method to <strong>POST</strong></li>
          <li>Add header: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-mono">Content-Type: application/json</code></li>
        </ol>
      </section>

      {/* Step 5: Test */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            5
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Test it</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Send a sample payload to verify everything is working.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={testWebhook}
            disabled={testing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {testing ? "Sending…" : "Send test webhook"}
          </button>
          {testResult === "success" && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Lead created successfully
            </span>
          )}
          {testResult === "error" && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
              <XCircle className="w-4 h-4" />
              Test failed — check your configuration
            </span>
          )}
        </div>
        {testResult === "success" && (
          <a
            href="/admin/crm/prospects"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View in CRM pipeline
          </a>
        )}
      </section>

      {/* Step 6: GA4 Funnel Tracking */}
      <section className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">
            6
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 text-base">GA4 Funnel Tracking</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              How the full funnel attribution works end-to-end.
            </p>
          </div>
        </div>

        {/* Funnel diagram */}
        <div className="space-y-3 mb-6">
          {[
            { step: "WordPress visitor fills form", detail: "Elementor captures _ga cookie value via hidden field" },
            { step: "Webhook fires → portal creates Prospect", detail: "gaClientId stored from form submission" },
            { step: "Consultant moves prospect through stages", detail: "Portal sends server-side GA4 events with the same gaClientId" },
            { step: "GA4 connects browser session to outcome", detail: "Full funnel: page_view → generate_lead → deal_won" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{item.step}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Important notes */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-medium text-amber-800 mb-2">Important notes</p>
          <ul className="space-y-1.5 text-xs text-amber-700">
            <li>• This only works if the visitor has not blocked GA4 or used incognito mode</li>
            <li>• Server-side events appear in standard reports after 24–48 hours</li>
            <li>• Use GA4 DebugView to verify events during testing</li>
            <li>• Attribution will be directionally correct but not 100% complete</li>
          </ul>
        </div>

        {/* Verification steps */}
        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-700 mb-2">Verify your setup</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
            <li>Submit a test lead via your WordPress form</li>
            <li>Check the CRM pipeline — lead should appear with a GA Client ID value</li>
            <li>Move the lead to SQL stage in the pipeline</li>
            <li>Wait 24–48 hours and check GA4 → Reports → Engagement → Events for &quot;lead_qualified&quot; event</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
