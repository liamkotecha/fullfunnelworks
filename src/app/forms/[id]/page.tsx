"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormField {
  id: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface FormSchema {
  name: string;
  primaryColor: string;
  fields: FormField[];
  successMessage: string;
  redirectUrl?: string | null;
}

export default function EmbedFormPage() {
  const params = useParams();
  const id = params?.id as string;

  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/forms/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setGlobalError(d.error); setLoading(false); return; }
        setSchema(d);
        const initial: Record<string, string> = {};
        for (const f of d.fields) initial[f.id] = "";
        setValues(initial);
        setLoading(false);
      })
      .catch(() => { setGlobalError("Could not load form."); setLoading(false); });
  }, [id]);

  const validate = () => {
    if (!schema) return false;
    const errs: Record<string, string> = {};
    for (const f of schema.fields) {
      const v = values[f.id]?.trim() ?? "";
      if (f.required && !v) { errs[f.id] = `${f.label} is required`; continue; }
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        errs[f.id] = "Enter a valid email address";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setGlobalError(null);
    try {
      const res = await fetch(`/api/public/forms/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json() as { ok?: boolean; error?: string; redirectUrl?: string | null };
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setGlobalError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const color = schema?.primaryColor ?? "#6CC2FF";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (globalError && !schema) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <p className="text-sm text-slate-500 text-center">{globalError}</p>
      </div>
    );
  }

  if (submitted && schema) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center gap-4">
        <CheckCircle2 className="w-10 h-10" style={{ color }} />
        <p className="text-lg font-semibold text-slate-900">
          {schema.successMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-stretch">
      <div className="w-full max-w-lg mx-auto px-6 py-10">
        {schema && (
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
            <h1 className="text-xl font-bold text-slate-900 mb-6">{schema.name}</h1>

            {schema.fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.id}
                    rows={4}
                    placeholder={field.placeholder}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 resize-none"
                    style={{ "--tw-ring-color": color } as React.CSSProperties}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.id}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                  >
                    <option value="">Select an option…</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.id}
                    type={field.type === "phone" ? "tel" : field.type}
                    placeholder={field.placeholder}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2"
                    autoComplete={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "off"}
                  />
                )}

                {errors[field.id] && (
                  <p className="mt-1 text-xs text-red-500">{errors[field.id]}</p>
                )}
              </div>
            ))}

            {globalError && (
              <p className="text-sm text-red-500 text-center">{globalError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: color,
                color: "#0C0C0C",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Sending…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
