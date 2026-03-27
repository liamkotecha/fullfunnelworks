import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {name: "Starter", price: "£129", period: "/ month",
    description: "For independent consultants managing 1–3 clients.",
    highlight: false,
    features: [
      "Up to 3 active client portals",
      "Core framework: Assessment, People, Product, Process",
      "GTM Playbook & KPI tracking",
      "Strategic Roadmap module",
      "Client-facing portal access",
      "14-day free trial",
      "Email support",
    ],
    cta: "Start free trial",
    href: "/register?role=consultant",
  },
  {
    name: "Growth",
    price: "£995",
    period: "/ month",
    description: "For boutique consultancies scaling their client base.",
    highlight: true,
    features: [
      "Up to 15 active client portals",
      "Everything in Starter",
      "Revenue Execution module",
      "Execution Planning & 90-day accountability",
      "Financial Modeller (scenario planning)",
      "Hiring Plan & headcount modeller",
      "Up to 3 projects per client",
      "Priority email & chat support",
    ],
    cta: "Start free trial",
    href: "/register?role=consultant",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large consultancies and in-house revenue teams.",
    highlight: false,
    features: [
      "Unlimited client portals",
      "Everything in Growth",
      "Unlimited projects per client",
      "White-label portal branding",
      "SSO & advanced security",
      "Dedicated account manager",
      "Custom integrations & SLA",
      "Onboarding & training sessions",
    ],
    cta: "Contact us",
    href: "mailto:hello@fullf.io",
  },
] as const;

const faqs = [
  {
    q: "What is the Full Funnel Growth Framework?",
    a: "It's a structured consulting methodology covering 6 pillars: Assessment, People, Process, GTM, Product, and Execution Planning — each broken into sub-modules that guide consultants and clients through diagnosis, strategy, and execution.",
  },
  {
    q: "Do my clients need to pay separately?",
    a: "No. Your subscription covers unlimited client portal logins. Clients access their dedicated portal with read-only views of the work you've done together.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — all plans include a 14-day free trial with full feature access. No credit card required to start.",
  },
  {
    q: "Can I switch plans?",
    a: "You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You'll have 30 days to export your data after cancellation. We retain it securely for that period and delete it on request.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">

      {/* ─────────────────── Nav ─────────────────── */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo_blue_650.webp" alt="Full Funnel" width={120} height={32} className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-navy transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-navy text-white hover:bg-navy-600 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────── Hero ─────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 text-sm font-medium text-navy mb-6">
          14-day free trial · No credit card required
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-navy tracking-tight leading-tight mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Give your clients a world-class consulting experience. Choose the plan that fits your practice.
        </p>
      </section>

      {/* ─────────────────── Plans ─────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border ${
                plan.highlight
                  ? "bg-navy border-navy shadow-modal text-white ring-2 ring-brand-blue/60"
                  : "bg-white border-slate-200 shadow-card"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold uppercase tracking-widest text-brand-blue mb-4">
                  Most popular
                </div>
              )}
              <div className="mb-6">
                <h2
                  className={`text-xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-navy"}`}
                >
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-navy"}`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.highlight ? "text-slate-300" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>
                  {plan.description}
                </p>
              </div>

              <Link
                href={plan.href}
                className={`block w-full text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors mb-8 ${
                  plan.highlight
                    ? "bg-[#6CC2FF] text-[#141414] hover:bg-[#6CC2FF]/90"
                    : "bg-[#141414] text-white hover:bg-[#141414]/80"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlight ? "text-brand-green" : "text-brand-green"}`}
                    />
                    <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── Social proof ─────────────────── */}
      <section className="border-t border-slate-100 bg-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 uppercase tracking-wide font-semibold mb-8">
            Built for consultants who deliver measurable revenue growth
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { stat: "6 pillars", label: "of proven growth methodology" },
              { stat: "100%", label: "client-facing portal included" },
              { stat: "14 days", label: "free trial, cancel anytime" },
            ].map((item) => (
              <div key={item.stat}>
                <div className="text-3xl font-extrabold text-navy mb-1">{item.stat}</div>
                <div className="text-sm text-slate-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── FAQ ─────────────────── */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-navy text-center mb-10">Frequently asked questions</h2>
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-navy mb-2">{faq.q}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── CTA banner ─────────────────── */}
      <section className="bg-navy py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to modernise your consulting practice?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Start your free trial today. Set up your first client portal in minutes.
          </p>
          <Link
            href="/register?role=consultant"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#6CC2FF] text-[#141414] font-bold text-sm hover:bg-[#6CC2FF]/90 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* ─────────────────── Footer ─────────────────── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Image src="/logo_blue_650.webp" alt="Full Funnel" width={100} height={28} className="h-6 w-auto opacity-60" />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Full Funnel. All rights reserved.</p>
          <Link href="/login" className="text-xs text-slate-400 hover:text-navy transition-colors">
            Sign in
          </Link>
        </div>
      </footer>

    </div>
  );
}
