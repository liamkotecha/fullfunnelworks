"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Check,
  ChevronDown,
  ArrowRight,
  Users,
  BarChart3,
  Target,
  Layers,
  TrendingUp,
  Zap,
  LineChart,
  FileText,
  Globe,
  Menu,
  X,
  Quote,
} from "lucide-react";

// ─── Static data ─────────────────────────────────────────────────────────────

const PILLARS = [
  { icon: BarChart3,  n: "01", name: "Assessment & Diagnosis",   desc: "Deep-dive diagnostic across revenue, positioning, and market fit — so you and your client know exactly where the business stands before strategy is set." },
  { icon: Users,      n: "02", name: "People & Organisation",    desc: "Org design, team capability mapping, and leadership alignment. Build on the right foundations before you scale." },
  { icon: Target,     n: "03", name: "Product & Market Fit",     desc: "ICP clarity, positioning sharpness, and product-market alignment that turns strategy into sustainable, profitable traction." },
  { icon: Layers,     n: "04", name: "Process & Operations",     desc: "Revenue workflows, CRM hygiene, and pipeline discipline that remove friction from your client's growth engine." },
  { icon: TrendingUp, n: "05", name: "GTM & Revenue Execution",  desc: "Go-to-market strategy, sales motion design, and channel optimisation that drives predictable, repeatable revenue." },
  { icon: Zap,        n: "06", name: "Execution Planning",       desc: "90-day accountability sprints, OKRs, and structured delivery so every strategy becomes measurable action — every quarter." },
] as const;

const TESTIMONIALS = [
  {
    quote: "AVC worked with Jonathan in 2024 to turbocharge the company's sales processes and redefine the way we engage with customers. Jonathan is engaging and personable, unafraid to call things as they are. His huge commercial experience and acumen were exactly what we needed.",
    name: "Ross Penney",
    title: "CEO, AVC",
  },
  {
    quote: "Full Funnel guided our Executive team on sales and marketing operational development, enhancing processes and embedding best practices for sustainable growth. His expertise in sales, operations, and customer-led solutions was invaluable.",
    name: "Paul Ford",
    title: "CEO, Acin",
  },
  {
    quote: "Jonathan provided exceptional strategic clarity as Interim Managing Director, crafting a strong go-to-market strategy with a detailed implementation plan. His expertise in building high-performance teams, driving revenue, and delivering measurable results makes him an invaluable advisor.",
    name: "Kay McGregor",
    title: "CEO, Elgin Scott Partners",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    monthly: 49, annual: 490, annualMonthly: 40, annualSaving: 98,
    description: "For independent consultants managing 1–5 client relationships.",
    highlight: false, badge: null,
    features: [
      "Up to 5 active client portals",
      "Assessment, People & Product modules",
      "Client-facing portal access",
      "Guided framework prompts",
      "14-day free trial",
      "Email support",
    ],
    cta: "Start free trial", href: "/register?role=consultant",
  },
  {
    name: "Growth",
    monthly: 99, annual: 990, annualMonthly: 82, annualSaving: 198,
    description: "For boutique consultancies scaling their practice.",
    highlight: true, badge: "Most popular",
    features: [
      "Up to 15 active client portals",
      "Everything in Starter",
      "Process, KPIs & GTM modules",
      "Hiring Plan module",
      "3 projects per client",
      "14-day free trial",
      "Priority email & chat support",
    ],
    cta: "Start free trial", href: "/register?role=consultant",
  },
  {
    name: "Enterprise",
    monthly: 249, annual: 2490, annualMonthly: 208, annualSaving: 498,
    description: "For large consultancies and in-house revenue teams.",
    highlight: false, badge: null,
    features: [
      "Unlimited client portals",
      "Everything in Growth",
      "Revenue Execution & Planning modules",
      "Financial Modeller",
      "Strategic Roadmap",
      "White-label portal branding",
      "Dedicated account manager",
    ],
    cta: "Get started", href: "/register?role=consultant",
  },
] as const;

const FAQS = [
  { q: "What is the Full Funnel Growth Framework?", a: "It's Jonathan Hebbes' proven consulting methodology covering 6 pillars: Assessment & Diagnosis, People & Organisation, Product & Market Fit, Process & Operations, GTM & Revenue Execution, and Execution Planning — each broken into guided sub-modules that help you diagnose, strategise, and execute with clients consistently." },
  { q: "Do my clients need to pay separately?", a: "No. Your subscription covers all client portal logins. Clients access their dedicated portal with a view of the work you've done together — at no extra cost to them." },
  { q: "Is there a free trial?", a: "Yes — all plans include a 14-day free trial with full feature access. No credit card required to start." },
  { q: "Can I switch plans?", a: "You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle." },
  { q: "What happens to my data if I cancel?", a: "You'll have 30 days to export your data after cancellation. We retain it securely for that period and delete it on request." },
  { q: "Is Full Funnel right for in-house strategy teams?", a: "Yes. The Enterprise plan is used by internal GTM, growth, and strategy leadership teams who want a structured operating framework for execution and accountability." },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function FadeUp({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400, t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - t0) / dur, 1);
      setDisplay(Math.round((1 - Math.pow(1 - t, 3)) * value));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0]);

  return (
    <div className="min-h-screen bg-cream overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>

      {/* ══════════════════════════════════════════════════ NAV */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/25 bg-white/85 backdrop-blur-xl shadow-[0_2px_24px_rgba(15,31,61,0.07)] px-5 h-14">
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo_blue_650.webp" alt="Full Funnel" width={120} height={32} className="h-7 w-auto" style={{ filter: "brightness(0)" }} priority />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#framework" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Framework</a>
              <a href="#features"  className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Features</a>
              <a href="#pricing"   className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Pricing</a>
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-navy transition-colors">Sign in</Link>
              <Link href="/register?role=consultant" className="text-sm font-bold px-5 py-2 rounded-xl bg-[#141414] text-white hover:bg-[#141414]/88 transition-all hover:shadow-lg">Get started</Link>
            </div>
            <button className="md:hidden p-2 text-slate-600 hover:text-navy" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mt-2 rounded-2xl border border-slate-200 bg-white/98 backdrop-blur-xl shadow-modal p-6 flex flex-col gap-4"
              >
                <a href="#framework" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600">Framework</a>
                <a href="#features"  onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600">Features</a>
                <a href="#pricing"   onClick={() => setMenuOpen(false)} className="text-sm font-medium text-slate-600">Pricing</a>
                <div className="h-px bg-slate-100" />
                <Link href="/login" className="text-sm font-medium text-slate-600">Sign in</Link>
                <Link href="/register?role=consultant" className="text-sm font-bold px-5 py-3 rounded-xl bg-[#141414] text-white text-center" onClick={() => setMenuOpen(false)}>Get started free</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════ HERO */}
      <section ref={heroRef} className="relative min-h-screen bg-[#141414] flex flex-col items-center justify-center overflow-hidden pt-28 pb-20">
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[18%] left-[12%] w-[580px] h-[580px] bg-[#6CC2FF]/8 rounded-full blur-[130px]" />
          <div className="absolute bottom-[20%] right-[8%]  w-[440px] h-[440px] bg-[#6CC2FF]/5 rounded-full blur-[110px]" />
          <div className="absolute top-[62%] left-[52%] w-[320px] h-[320px] bg-[#6CC2FF]/4 rounded-full blur-[90px]" />
        </motion.div>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(108,194,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(108,194,255,0.03) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#6CC2FF]/25 bg-[#6CC2FF]/10 text-[#6CC2FF] text-sm font-medium mb-10"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6CC2FF] animate-pulse shrink-0" />
            Business performance consulting, structured for scale
          </motion.div>
          <h1 className="text-[clamp(2.8rem,8vw,5.2rem)] font-extrabold tracking-tighter leading-[1.04] text-white mb-7">
            <span className="block overflow-hidden">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 0.88, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}>
                Turn strategy into
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span className="block" initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ duration: 0.88, delay: 0.33, ease: [0.25, 0.46, 0.45, 0.94] }}>
                <span style={{ background: "linear-gradient(135deg, #6CC2FF 0%, #a5d8ff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  measurable results.
                </span>
              </motion.span>
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.74 }} className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-11">
            Full Funnel gives growth consultants a structured platform to diagnose businesses, build executable strategies, and show clients exactly what good looks like. From first assessment to 90-day accountability sprint, every engagement runs on one platform.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.9 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register?role=consultant" className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#6CC2FF] text-[#141414] font-bold text-sm transition-all hover:bg-[#6CC2FF] hover:shadow-[0_0_36px_rgba(108,194,255,0.45)] hover:scale-[1.025] active:scale-[0.98]">
              Start free trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#pricing" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/14 text-white/75 font-semibold text-sm hover:border-white/25 hover:text-white hover:bg-white/5 transition-all">
              See pricing
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.1 }} className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {[{ v: "90-day", l: "execution sprints built in" }, { v: "3 CEOs", l: "reference clients" }, { v: "14-day", l: "free trial, no card needed" }].map((s) => (
              <div key={s.l} className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-[#6CC2FF]">{s.v}</span>
                <span className="text-sm text-slate-500">{s.l}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-9 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="w-[22px] h-[34px] rounded-full border border-white/18 flex items-start justify-center pt-[7px]">
            <div className="w-[3px] h-[8px] rounded-full bg-white/35" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════ PLATFORM */}
      <section className="bg-cream py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">The platform</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-navy mb-5">Structured consulting, delivered consistently.</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">Stop rebuilding from a blank page on every engagement. Full Funnel gives you the platform, the framework, and the client portal to deliver professional, measurable outcomes — every time.</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Globe,     title: "Client portals",         desc: "Every client gets their own branded portal. They see the work — strategy, progress, next actions — without you explaining everything twice.", accent: "#6CC2FF" },
              { icon: FileText,  title: "Built-in methodology",   desc: "6 framework modules with guided prompts, structured worksheets, and consultant notes — so you never start from a blank page again.", accent: "#6CC2FF" },
              { icon: LineChart, title: "Financial intelligence",  desc: "Hiring plans, OKRs, scenario models, and 90-day sprints — the quantitative rigour that turns strategic advice into board-ready deliverables.", accent: "#6CC2FF" },
            ].map((c, i) => (
              <FadeUp key={c.title} delay={i * 0.1}>
                <div className="group rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-card-hover transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${c.accent}18` }}>
                    <c.icon style={{ color: c.accent }} className="w-5 h-5" />
                  </div>
                  <h3 className="text-[17px] font-bold text-navy mb-2.5">{c.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ FRAMEWORK */}
      <section id="framework" className="bg-[#141414] py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">Methodology</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-white mb-5">Six pillars. One platform.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">A proven consulting framework covering People, Product, Process, GTM, and Execution, structured into a platform that delivers consistent, measurable results for every client.</p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }} className="group rounded-2xl border border-white/[0.07] bg-white/[0.04] p-7 hover:bg-white/[0.08] hover:border-[#6CC2FF]/20 transition-all duration-300 cursor-default">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[11px] font-bold tabular-nums text-slate-600 font-mono">{p.n}</span>
                  <div className="flex-1 h-px bg-white/[0.07]" />
                </div>
                <p.icon className="w-6 h-6 text-[#6CC2FF] mb-3.5 group-hover:scale-110 transition-transform duration-200" />
                <h3 className="font-bold text-white text-[15px] mb-2.5 leading-snug">{p.name}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ FEATURES */}
      <section id="features" className="bg-cream py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">Features</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-navy">{"Everything you need. Nothing you don't."}</h2>
          </FadeUp>
          <div className="space-y-28">
            {(
              [
                { tag: "Client experience",     title: "Portals your clients will actually use.",          desc: "Each client gets a private, branded portal with their own login. They review framework outputs, track progress, and download deliverables — without you explaining everything again.",   points: ["Branded portal per client","Real-time progress visibility","Secure document access","No client licence fee"],        flip: false, accent: "#6CC2FF", glow: "rgba(108,194,255,0.12)" },
                { tag: "Framework delivery",    title: "A methodology that delivers every time.",           desc: "Stop rebuilding from scratch on every engagement. Every module follows the Full Funnel Growth Framework — People \u00b7 Product \u00b7 Process \u00b7 GTM — with guided prompts and best-practice templates baked in from day one.", points: ["6 built-in framework modules","Guided section prompts","Consultant notes per section","PDF export ready"],              flip: true,  accent: "#6CC2FF", glow: "rgba(108,194,255,0.10)" },
                { tag: "Financial intelligence", title: "Back every recommendation with numbers.",          desc: "Go beyond strategy slides. Build hiring plans, revenue forecasts, and scenario models that give your work a commercial edge — and justify every recommendation you make to the board.",                   points: ["Revenue scenario modelling","Headcount & hiring plans","OKR & 90-day goals","Export-ready outputs"],                      flip: false, accent: "#6CC2FF", glow: "rgba(108,194,255,0.10)" },
              ] as const
            ).map((f) => (
              <div key={f.tag} className={`flex flex-col ${f.flip ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 lg:gap-20`}>
                <FadeUp className="flex-1 max-w-xl" delay={0}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: f.accent }}>{f.tag}</p>
                  <h3 className="text-3xl sm:text-[2.35rem] font-extrabold tracking-tighter text-navy leading-tight mb-5">{f.title}</h3>
                  <p className="text-base text-slate-500 leading-relaxed mb-9">{f.desc}</p>
                  <ul className="space-y-3.5">
                    {f.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-3 text-[14px] text-slate-700">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${f.accent}20` }}>
                          <Check className="w-3 h-3" style={{ color: "#0284c7" }} />
                        </div>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </FadeUp>
                <FadeUp className="flex-1 w-full max-w-xl" delay={0.15}>
                  <div className="rounded-3xl p-10 aspect-[4/3] flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(145deg, #0F1F3D 0%, #0a1628 100%)", boxShadow: `0 30px 80px rgba(15,31,61,0.35), 0 0 60px ${f.glow} inset` }}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle, ${f.accent} 1px, transparent 1px)`, backgroundSize: "28px 28px" }} />
                    <div className="relative w-full space-y-3.5">
                      <div className="h-3 rounded-full bg-white/10 w-3/5" />
                      <div className="h-2 rounded-full bg-white/[0.06] w-full" />
                      <div className="h-2 rounded-full bg-white/[0.06] w-5/6" />
                      <div className="mt-6 p-4 rounded-2xl border" style={{ borderColor: `${f.accent}25`, background: `${f.accent}08` }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: f.accent }} />
                          <div className="h-2 rounded-full bg-white/15 flex-1" />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-end">
                          {([55, 38, 25] as const).map((h, j) => (
                            <div key={j} className="space-y-1.5">
                              <div className="rounded-lg" style={{ background: `linear-gradient(180deg, ${f.accent}32 0%, ${f.accent}12 100%)`, height: `${h}px` }} />
                              <div className="h-1.5 rounded-full bg-white/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <div className="h-7 rounded-lg flex-1 flex items-center px-3" style={{ background: `${f.accent}15`, border: `1px solid ${f.accent}25` }}>
                          <div className="h-1.5 rounded-full" style={{ background: f.accent, width: "60%", opacity: 0.6 }} />
                        </div>
                        <div className="h-7 w-7 rounded-lg bg-white/[0.06]" />
                      </div>
                    </div>
                  </div>
                </FadeUp>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════ TESTIMONIALS */}
      <section className="bg-[#141414] py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">Client outcomes</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-white mb-5">What CEOs say.</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">Real outcomes from real engagements. Every quote is from a CEO who has worked directly with Jonathan Hebbes.</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-8 flex flex-col gap-6 hover:bg-white/[0.07] hover:border-[#6CC2FF]/20 transition-all duration-300">
                <Quote className="w-7 h-7 text-[#6CC2FF] opacity-60 shrink-0" />
                <p className="text-[14px] text-slate-300 leading-relaxed flex-1">{`"${t.quote}"`}</p>
                <div>
                  <p className="font-bold text-white text-[15px]">{t.name}</p>
                  <p className="text-[12px] text-[#6CC2FF] mt-0.5">{t.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ HOW IT WORKS */}
      <section className="bg-cream py-28">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-navy">Up and running in minutes.</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute h-px bg-slate-200" style={{ top: "27px", left: "calc(33.33% + 32px)", right: "calc(33.33% + 32px)" }} />
            {[
              { step: "01", title: "Choose your plan",      desc: "Start a 14-day free trial — no card required. Sign up in under two minutes and you're ready to go." },
              { step: "02", title: "Add your first client", desc: "Invite your client to their portal. They see your framework, progress, and deliverables — live." },
              { step: "03", title: "Deliver the framework", desc: "Work through the 6 pillars together. Generate insights, models, and board-ready reports — all in one place." },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.12 }}>
                <div className="w-14 h-14 rounded-2xl bg-[#6CC2FF]/10 border border-[#6CC2FF]/20 flex items-center justify-center mb-6 font-mono text-[#6CC2FF] font-extrabold text-sm">{s.step}</div>
                <h3 className="font-bold text-navy text-[17px] mb-2.5">{s.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ STATS */}
      <section className="bg-cream py-20">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp>
            <div className="rounded-3xl bg-white border border-slate-200 shadow-card p-10 sm:p-14">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-12 text-center">By the numbers</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
                {[
                  { v: 6,   s: "",     l: "Framework pillars" },
                  { v: 14,  s: "-day", l: "Free trial included" },
                  { v: 100, s: "%",    l: "Portal access included" },
                  { v: 3,   s: "",     l: "Plans for every practice" },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="text-4xl font-extrabold text-navy mb-1.5"><Counter value={s.v} suffix={s.s} /></div>
                    <div className="text-[13px] text-slate-500">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ═══════════════════════════════════════ PRICING */}
      <section id="pricing" className="bg-cream py-28">
        <div className="max-w-6xl mx-auto px-6">
          <FadeUp className="text-center mb-12">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-4">Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-navy mb-5">Simple, transparent pricing.</h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10">Every plan includes a 14-day free trial, full feature access, and unlimited client portal logins.</p>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 gap-1">
              <button onClick={() => setAnnual(false)} className={`px-5 py-2 rounded-[10px] text-sm font-bold transition-all ${!annual ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)}  className={`px-5 py-2 rounded-[10px] text-sm font-bold transition-all flex items-center gap-2 ${annual ? "bg-white text-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                Annual
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full transition-colors ${annual ? "bg-[#6CC2FF] text-[#141414]" : "bg-slate-200 text-slate-500"}`}>Save 17%</span>
              </button>
            </div>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.6, delay: i * 0.1 }} className={`rounded-3xl p-8 flex flex-col ${plan.highlight ? "bg-[#141414] ring-2 ring-[#6CC2FF]/35 shadow-modal" : "bg-white border border-slate-200 shadow-card"}`}>
                {plan.badge && <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6CC2FF] mb-3">{plan.badge}</p>}
                <div className="mb-7">
                  <h3 className={`text-xl font-extrabold mb-3 ${plan.highlight ? "text-white" : "text-navy"}`}>{plan.name}</h3>
                  <div className="flex items-end gap-1.5 mb-1">
                    <AnimatePresence mode="wait">
                      <motion.span key={annual ? "a" : "m"} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.22 }} className={`text-[42px] font-extrabold leading-none tracking-tighter ${plan.highlight ? "text-white" : "text-navy"}`}>
                        {`£${annual ? plan.annualMonthly : plan.monthly}`}
                      </motion.span>
                    </AnimatePresence>
                    <span className={`text-sm pb-1 ${plan.highlight ? "text-slate-400" : "text-slate-400"}`}>{`/mo${annual ? ", billed annually" : ""}`}</span>
                  </div>
                  <AnimatePresence>
                    {annual && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`text-xs mt-1 mb-2 ${plan.highlight ? "text-slate-500" : "text-slate-400"}`}>
                        {`£${plan.annual}/yr — save £${plan.annualSaving}`}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className={`text-sm leading-relaxed mt-2 ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>{plan.description}</p>
                </div>
                <Link href={plan.href} className={`block w-full text-center px-4 py-3.5 rounded-2xl font-bold text-sm transition-all mb-8 hover:scale-[1.018] active:scale-[0.985] ${plan.highlight ? "bg-[#6CC2FF] text-[#141414] hover:bg-[#6CC2FF] hover:shadow-[0_6px_24px_rgba(108,194,255,0.35)]" : "bg-[#141414] text-white hover:bg-[#141414]/88 hover:shadow-lg"}`}>{plan.cta}</Link>
                <ul className="space-y-3 mt-auto">
                  {plan.features.map((ft) => (
                    <li key={ft} className="flex items-start gap-3 text-[13px]">
                      <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 mt-[1px] ${plan.highlight ? "bg-[#6CC2FF]/18" : "bg-[#6CC2FF]/14"}`}>
                        <Check className="w-[10px] h-[10px]" style={{ color: plan.highlight ? "#6CC2FF" : "#0284c7" }} />
                      </div>
                      <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>{ft}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <FadeUp className="mt-8 text-center" delay={0.2}>
            <p className="text-sm text-slate-400">
              Need a custom contract or volume deal?{" "}
              <a href="mailto:hello@fullfunnelworks.co.uk" className="font-semibold text-navy hover:underline underline-offset-2">Talk to us →</a>
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════════════ TRUST BAR */}
      <section className="bg-white py-14 border-t border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp>
            <div className="flex flex-wrap items-center justify-center gap-10 sm:gap-16">
              {[
                "Built on Jonathan's proven consulting methodology",
                "Trusted by CEOs at AVC, Acin & Elgin Scott Partners",
                "Cancel anytime — no lock-in",
                "14-day free trial on every plan",
              ].map((label) => (
                <div key={label} className="flex items-center gap-2.5 text-[13px] text-slate-500">
                  <Check className="w-4 h-4 text-[#6CC2FF] shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════════════════ FAQ */}
      <section className="bg-cream py-28">
        <div className="max-w-3xl mx-auto px-6">
          <FadeUp className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-navy">Frequently asked questions</h2>
          </FadeUp>
          <div className="space-y-2.5">
            {FAQS.map((faq, i) => (
              <FadeUp key={faq.q} delay={i * 0.04}>
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden cursor-pointer hover:border-slate-300 transition-colors duration-200" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <div className="flex items-center justify-between px-6 py-5 gap-4">
                    <span className="font-semibold text-navy text-[14px] leading-snug">{faq.q}</span>
                    <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </div>
                  <AnimatePresence initial={false}>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>
                        <div className="px-6 pb-6 text-[13px] text-slate-500 leading-relaxed border-t border-slate-100 pt-4">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════ FINAL CTA */}
      <section className="bg-cream pb-28">
        <div className="max-w-5xl mx-auto px-6">
          <FadeUp>
            <div className="relative rounded-3xl bg-[#141414] p-12 sm:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 right-0 w-[560px] h-[560px] bg-[#6CC2FF]/8 rounded-full blur-[130px]" />
                <div className="absolute -bottom-24 left-0 w-[440px] h-[440px] bg-[#6CC2FF]/5 rounded-full blur-[110px]" />
              </div>
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(108,194,255,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6CC2FF] mb-6">Get started today</p>
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter text-white mb-5">Ready to structure your practice?</h2>
                <p className="text-lg text-slate-400 mb-11 max-w-xl mx-auto leading-relaxed">Set up your first client portal in minutes. 14-day free trial on every plan — no credit card required.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register?role=consultant" className="group inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-[#6CC2FF] text-[#141414] font-bold text-sm transition-all hover:bg-[#6CC2FF] hover:shadow-[0_0_40px_rgba(108,194,255,0.4)] hover:scale-[1.025] active:scale-[0.98]">
                    Start free trial
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/login" className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl border border-white/12 text-white/70 font-semibold text-sm hover:border-white/22 hover:text-white hover:bg-white/5 transition-all">Sign in to your account</Link>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════════════ FOOTER */}
      <footer className="bg-cream border-t border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <Image src="/logo_blue_650.webp" alt="Full Funnel" width={100} height={28} className="h-6 w-auto" style={{ filter: "brightness(0) opacity(0.4)" }} />
              <nav className="hidden sm:flex items-center gap-6">
                <a href="#framework" className="text-xs text-slate-400 hover:text-navy transition-colors">Framework</a>
                <a href="#features"  className="text-xs text-slate-400 hover:text-navy transition-colors">Features</a>
                <a href="#pricing"   className="text-xs text-slate-400 hover:text-navy transition-colors">Pricing</a>
                <a href="mailto:hello@fullfunnelworks.co.uk" className="text-xs text-slate-400 hover:text-navy transition-colors">Contact</a>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <p className="text-xs text-slate-400">{`© ${new Date().getFullYear()} Full Funnel Works. All rights reserved.`}</p>
              <Link href="/login" className="text-xs text-slate-400 hover:text-navy transition-colors font-medium">Sign in →</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
