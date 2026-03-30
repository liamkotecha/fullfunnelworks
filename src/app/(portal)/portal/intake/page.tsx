"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Send, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/notifications/ToastContext";
import { cn } from "@/lib/utils";
import {
  INTAKE_SECTIONS_ORDERED,
  ASSESSMENT_SECTION,
  PEOPLE_SECTION,
  PRODUCT_SECTION,
  PROCESS_SECTION,
  ROADMAP_SECTION,
  KPIS_SECTION,
} from "@/lib/concept-map";

const sectionSlide = {
  enter: (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (d: number) => ({ opacity: 0, x: d * -36, transition: { duration: 0.2 } }),
};

function FieldText({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string;
}) {
  return multiline ? (
    <Textarea label={label} value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} />
  ) : (
    <Input label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  );
}

function ChecklistField({ items, values, onChange }: {
  items: readonly string[]; values: Record<string, boolean>; onChange: (k: string, v: boolean) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {items.map((item) => (
        <label key={item} className={cn(
          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
          values[item] ? "border-[#141414] bg-[#141414]/5" : "border-gray-100 hover:border-gray-200"
        )}>
          <input type="checkbox" checked={!!values[item]} onChange={(e) => onChange(item, e.target.checked)} className="mt-0.5 rounded accent-[#141414]" />
          <span className="text-sm text-slate-700 leading-snug">{item}</span>
        </label>
      ))}
    </div>
  );
}

export default function IntakePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("clientId") ?? "";
  const { success, error: toastError, info } = useToast();

  const [sectionIndex, setSectionIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [sectionProgress, setSectionProgress] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const sections = INTAKE_SECTIONS_ORDERED;
  const current = sections[sectionIndex];

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }
    fetch(`/api/intake?clientId=${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const obj = d.data.responses ?? {};
          setResponses(typeof obj === "object" ? (obj as Record<string, unknown>) : {});
          setSectionProgress(d.data.sectionProgress ?? {});
        }
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const set = useCallback((key: string, value: unknown) => {
    setResponses((p) => ({ ...p, [key]: value }));
  }, []);

  const goTo = (idx: number) => { setDir(idx > sectionIndex ? 1 : -1); setSectionIndex(idx); };

  const handleSave = async (andSubmit = false) => {
    if (!clientId) { info("No client", "Open from the client onboarding page."); return; }
    setSaving(true);
    const progress = { ...sectionProgress, [current.id]: true };
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, responses, sectionProgress: progress, submit: andSubmit }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSectionProgress(progress);
      if (andSubmit) {
        success("Intake submitted", "All sections submitted.");
        router.push(`/portal/clients/${clientId}`);
      } else { success("Progress saved"); }
    } catch (e) { toastError("Save failed", (e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-4xl mx-auto py-12 text-center text-slate-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Intake Form</h1>
          <p className="type-sub mt-0.5">Complete all sections to build your growth strategy.</p>
        </div>
        <Button size="sm" variant="secondary" leftIcon={<Save className="w-3.5 h-3.5" />} isLoading={saving} onClick={() => handleSave(false)}>
          Save Progress
        </Button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {sections.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
            i === sectionIndex ? "bg-[#141414] text-white shadow-sm" :
            sectionProgress[s.id] ? "bg-brand-green/10 text-brand-green border border-brand-green/30" :
            "bg-gray-100 text-slate-500 hover:bg-gray-200"
          )}>
            {sectionProgress[s.id] && <CheckCircle className="w-3 h-3" />}
            {s.label}
          </button>
        ))}
      </div>

      <div className="card min-h-[420px] overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={current.id} custom={dir} variants={sectionSlide} initial="enter" animate="center" exit="exit" className="space-y-6">

            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="neutral">{sectionIndex + 1} / {sections.length}</Badge>
                {sectionProgress[current.id] && <Badge variant="success" dot>Saved</Badge>}
              </div>
              <h2 className="text-lg font-serif text-[#141414]">{current.label}</h2>
            </div>

            {current.id === "overview" && (
              <div className="space-y-4">
                <FieldText label="Business Name" value={(responses["overview_businessName"] as string) ?? ""} onChange={(v) => set("overview_businessName", v)} />
                <FieldText label="Industry" value={(responses["overview_industry"] as string) ?? ""} onChange={(v) => set("overview_industry", v)} />
                <FieldText label="Year Founded" value={(responses["overview_yearFounded"] as string) ?? ""} onChange={(v) => set("overview_yearFounded", v)} />
                <FieldText label="Current Revenue" value={(responses["overview_revenue"] as string) ?? ""} onChange={(v) => set("overview_revenue", v)} />
                <FieldText label="Revenue Target" value={(responses["overview_target"] as string) ?? ""} onChange={(v) => set("overview_target", v)} />
                <FieldText label="Top Priority for Growth" value={(responses["overview_topPriority"] as string) ?? ""} onChange={(v) => set("overview_topPriority", v)} multiline />
              </div>
            )}

            {current.id === "assessment" && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">{ASSESSMENT_SECTION.intro}</p>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{ASSESSMENT_SECTION.checklistHeading}</h3>
                  <ChecklistField
                    items={ASSESSMENT_SECTION.checklist}
                    values={(responses["assessment_checklist"] as Record<string, boolean>) ?? {}}
                    onChange={(k, v) => set("assessment_checklist", { ...((responses["assessment_checklist"] as Record<string, boolean>) ?? {}), [k]: v })}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-1">{ASSESSMENT_SECTION.swot.heading}</h3>
                  <p className="text-xs text-slate-500 mb-4">{ASSESSMENT_SECTION.swot.intro}</p>
                  <p className="text-xs text-[#141414] bg-brand-blue/5 border border-brand-blue/20 rounded-lg px-3 py-2 mb-4">{ASSESSMENT_SECTION.swot.weightingNote}</p>
                  {(["strengths","weaknesses","opportunities","threats"] as const).map((group) => {
                    const g = ASSESSMENT_SECTION.swot[group];
                    const cls: Record<string,string> = { strengths:"bg-brand-green/5 border-brand-green/20", weaknesses:"bg-brand-pink/5 border-brand-pink/20", opportunities:"bg-brand-blue/5 border-brand-blue/20", threats:"bg-red-50 border-red-200" };
                    return (
                      <div key={group} className={cn("rounded-2xl border p-5 space-y-4 mb-4", cls[group])}>
                        <div><h4 className="font-bold text-sm uppercase tracking-wide">{g.label}</h4><p className="text-xs text-slate-500">{g.subtitle}</p></div>
                        {g.questions.map((q) => (
                          <div key={q.id} className="space-y-1.5">
                            <Textarea label={q.question} value={(responses[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} rows={2} placeholder="Your answer…" />
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-500 whitespace-nowrap">Importance (1–5):</label>
                              <select
                                value={(responses[q.weightId] as string) ?? ""}
                                onChange={(e) => set(q.weightId, e.target.value)}
                                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
                              >
                                <option value="">Select…</option>
                                {["1","2","3","4","5"].map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-1">{ASSESSMENT_SECTION.most.heading}</h3>
                  <p className="text-xs text-slate-500 mb-4">{ASSESSMENT_SECTION.most.intro}</p>
                  {(["mission","objectives","strategy","tactics"] as const).map((key) => {
                    const section = ASSESSMENT_SECTION.most[key];
                    const colors: Record<string,string> = { mission:"bg-slate-50 border-brand-blue/20", objectives:"bg-brand-blue/5 border-brand-blue/20", strategy:"bg-brand-green/5 border-brand-green/20", tactics:"bg-slate-50 border-slate-200" };
                    return (
                      <div key={key} className={cn("rounded-2xl border p-5 space-y-4 mb-4", colors[key])}>
                        <div>
                          <h4 className="font-bold text-sm uppercase tracking-wide">{section.label}</h4>
                          <p className="text-xs text-slate-500">{section.intro}</p>
                        </div>
                        {section.questions.map((q) => (
                          <Textarea key={q.id} label={q.question} value={(responses[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} rows={2} placeholder="Your answer…" />
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-1">{ASSESSMENT_SECTION.leadershipQuestions.heading}</h3>
                  <p className="text-xs text-slate-500 mb-4">{ASSESSMENT_SECTION.leadershipQuestions.intro}</p>
                  <div className="space-y-4">
                    {ASSESSMENT_SECTION.leadershipQuestions.questions.map((q, i) => (
                      <div key={q.id} className="border border-gray-100 rounded-2xl p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                          <div>
                            <p className="font-semibold text-[#141414] text-sm">{q.question}</p>
                            <p className="text-xs text-slate-500 italic mt-1">{q.subPrompt}</p>
                          </div>
                        </div>
                        <Textarea label="" value={(responses[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} rows={2} placeholder="Your answer…" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {current.id === "people" && (
              <div className="space-y-6">
                <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-lg p-4">
                  <h3 className="font-semibold text-[#141414] text-sm mb-2">{PEOPLE_SECTION.currentChallenges.heading}</h3>
                  <ul className="list-disc list-inside text-xs text-[#141414]/70 space-y-0.5">{PEOPLE_SECTION.currentChallenges.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-lg p-4">
                  <h3 className="font-semibold text-[#141414] text-sm mb-2">{PEOPLE_SECTION.strategicDirection.heading}</h3>
                  <ul className="list-disc list-inside text-xs text-[#141414]/70 space-y-0.5">{PEOPLE_SECTION.strategicDirection.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{PEOPLE_SECTION.checklistHeading}</h3>
                  <ChecklistField items={PEOPLE_SECTION.checklist} values={(responses["people_checklist"] as Record<string, boolean>) ?? {}} onChange={(k, v) => set("people_checklist", { ...((responses["people_checklist"] as Record<string, boolean>) ?? {}), [k]: v })} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{PEOPLE_SECTION.teamCapabilityTracker.heading}</h3>
                  <div className="space-y-3">
                    {PEOPLE_SECTION.teamCapabilityTracker.fields.map((field) => (
                      field.type === "textarea" ? (
                        <Textarea key={field.id} label={field.label} value={(responses[field.id] as string) ?? ""} onChange={(e) => set(field.id, e.target.value)} placeholder={field.placeholder} rows={2} />
                      ) : field.type === "range" ? (
                        <div key={field.id} className="space-y-1.5">
                          <label className="block type-label">{field.label}</label>
                          <div className="flex items-center gap-3">
                            <input type="range" min={(field as { min?: number }).min} max={(field as { max?: number }).max} value={(responses[field.id] as number) ?? (field as { defaultValue?: number }).defaultValue ?? 50} onChange={(e) => set(field.id, Number(e.target.value))} className="flex-1 accent-[#141414]" />
                            <span className="text-sm font-semibold text-[#141414] w-8 text-right">{(responses[field.id] as number) ?? (field as { defaultValue?: number }).defaultValue ?? 50}</span>
                          </div>
                        </div>
                      ) : (
                        <Input key={field.id} label={field.label} value={(responses[field.id] as string) ?? ""} onChange={(e) => set(field.id, e.target.value)} placeholder={field.placeholder} />
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {current.id === "product" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{PRODUCT_SECTION.checklistHeading}</h3>
                  <ChecklistField items={PRODUCT_SECTION.checklist} values={(responses["product_checklist"] as Record<string, boolean>) ?? {}} onChange={(k, v) => set("product_checklist", { ...((responses["product_checklist"] as Record<string, boolean>) ?? {}), [k]: v })} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-1">{PRODUCT_SECTION.outcomeMapper.heading}</h3>
                  <p className="text-xs text-slate-500 mb-4">{PRODUCT_SECTION.outcomeMapper.intro}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PRODUCT_SECTION.outcomeMapper.columns.map((col) => (
                      <div key={col.id} className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-[#141414] uppercase tracking-widest mb-2">{col.label}</h4>
                        <Textarea label="" value={(responses[col.id] as string) ?? ""} onChange={(e) => set(col.id, e.target.value)} placeholder={col.placeholder} rows={3} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {current.id === "process" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{PROCESS_SECTION.checklistHeading}</h3>
                  <ChecklistField items={PROCESS_SECTION.checklist} values={(responses["process_checklist"] as Record<string, boolean>) ?? {}} onChange={(k, v) => set("process_checklist", { ...((responses["process_checklist"] as Record<string, boolean>) ?? {}), [k]: v })} />
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-1">{PROCESS_SECTION.salesCapabilityMethodology.heading}</h3>
                  <p className="text-xs text-slate-500 mb-4">{PROCESS_SECTION.salesCapabilityMethodology.intro}</p>
                  {PROCESS_SECTION.salesCapabilityMethodology.phases.map((phase) => (
                    <div key={phase.number} className="border border-gray-100 rounded-2xl p-5 mb-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{phase.number}</div>
                        <div><h4 className="font-semibold text-[#141414] text-sm">{phase.title}</h4><p className="text-xs text-slate-500">{phase.objective}</p></div>
                      </div>
                      <div className="space-y-3">
                        {phase.questions.map((q) => (
                          <Textarea key={q.id} label={q.label} value={(responses[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} rows={2} placeholder="Your answer…" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{PROCESS_SECTION.salesProcessBuilder.heading}</h3>
                  {PROCESS_SECTION.salesProcessBuilder.stages.map((stage) => (
                    <div key={stage.id} className="bg-gray-50 rounded-2xl p-4 mb-3 space-y-3">
                      <h4 className="font-bold text-xs text-[#141414] uppercase tracking-widest">{stage.heading}</h4>
                      {stage.fields.map((f) => (
                        <Textarea key={f.label} label={f.label} value={(responses[`proc_stage_${stage.id}_${f.label}`] as string) ?? ""} onChange={(e) => set(`proc_stage_${stage.id}_${f.label}`, e.target.value)} placeholder={f.placeholder} rows={2} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {current.id === "roadmap" && (
              <div className="space-y-5">
                <p className="text-sm text-slate-600">{ROADMAP_SECTION.intro}</p>
                {ROADMAP_SECTION.phases.map((phase) => (
                  <div key={phase.number} className="border border-gray-100 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#141414] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{phase.number}</div>
                      <div><h3 className="font-semibold text-[#141414] text-sm">{phase.title}</h3><p className="text-xs text-slate-400">{phase.duration}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                      {phase.items.map((item) => <div key={item} className="flex items-start gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 flex-shrink-0" />{item}</div>)}
                    </div>
                    <Textarea label="Your notes / actions for this phase" value={(responses[`roadmap_notes_${phase.number}`] as string) ?? ""} onChange={(e) => set(`roadmap_notes_${phase.number}`, e.target.value)} rows={3} placeholder="What specifically will you do in this phase?" />
                  </div>
                ))}
              </div>
            )}

            {current.id === "kpis" && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">{KPIS_SECTION.intro}</p>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{KPIS_SECTION.companyKPIsHeading}</h3>
                  <div className="space-y-3">
                    {KPIS_SECTION.companyKPIPlaceholders.map((kpi, i) => (
                      <div key={i} className="grid sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        <Input label="KPI Name" placeholder={kpi.namePlaceholder} value={(responses[`company-kpi${i + 1}-name`] as string) ?? ""} onChange={(e) => set(`company-kpi${i + 1}-name`, e.target.value)} />
                        <Input label="Target Outcome" placeholder={kpi.outcomePlaceholder} value={(responses[`company-kpi${i + 1}-outcome`] as string) ?? ""} onChange={(e) => set(`company-kpi${i + 1}-outcome`, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-[#141414] text-sm mb-3">{KPIS_SECTION.departmentKPIsHeading}</h3>
                  <div className="space-y-3">
                    {KPIS_SECTION.deptKPIPlaceholders.map((kpi, i) => (
                      <div key={i} className="grid sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg">
                        <Input label="KPI Name" placeholder={kpi.namePlaceholder} value={(responses[`dept-kpi${i + 1}-name`] as string) ?? ""} onChange={(e) => set(`dept-kpi${i + 1}-name`, e.target.value)} />
                        <Input label="Target Outcome" placeholder={kpi.outcomePlaceholder} value={(responses[`dept-kpi${i + 1}-outcome`] as string) ?? ""} onChange={(e) => set(`dept-kpi${i + 1}-outcome`, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between">
        <Button variant="secondary" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => goTo(sectionIndex - 1)} disabled={sectionIndex === 0}>Previous</Button>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Save className="w-3.5 h-3.5" />} isLoading={saving} onClick={() => handleSave(false)}>Save</Button>
          {sectionIndex < sections.length - 1 ? (
            <Button rightIcon={<ChevronRight className="w-4 h-4" />} onClick={() => { handleSave(false); goTo(sectionIndex + 1); }}>Next</Button>
          ) : (
            <Button leftIcon={<Send className="w-4 h-4" />} isLoading={saving} onClick={() => handleSave(true)}>Submit Intake</Button>
          )}
        </div>
      </div>
    </div>
  );
}
