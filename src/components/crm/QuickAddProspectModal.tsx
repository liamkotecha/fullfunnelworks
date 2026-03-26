/**
 * QuickAddProspectModal — modal form to quickly add a new prospect from Pipeline.
 */
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ProspectDTO } from "@/types";

interface QuickAddProspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (prospect: ProspectDTO) => void;
}

const COMPANY_SIZES = [
  { label: "Select...", value: "" },
  { label: "1–10", value: "1-10" },
  { label: "11–50", value: "11-50" },
  { label: "51–200", value: "51-200" },
  { label: "201–500", value: "201-500" },
  { label: "500+", value: "500+" },
];

const REVENUE_RANGES = [
  { label: "Select...", value: "" },
  { label: "Pre-revenue", value: "pre-revenue" },
  { label: "Under £500k", value: "under-500k" },
  { label: "£500k–£2m", value: "500k-2m" },
  { label: "£2m–£10m", value: "2m-10m" },
  { label: "£10m+", value: "10m+" },
];

interface Consultant {
  _id: string;
  name: string;
}

export function QuickAddProspectModal({ isOpen, onClose, onCreated }: QuickAddProspectModalProps) {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    contactEmail: "",
    phone: "",
    companySize: "",
    revenueRange: "",
    primaryChallenge: "",
    dealValue: "",
    assignedConsultant: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ businessName?: string; contactName?: string; contactEmail?: string }>({});
  const [consultants, setConsultants] = useState<Consultant[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/settings")
      .then(() =>
        fetch("/api/clients")
          .then((r) => r.json())
          .catch(() => ({ data: [] }))
      )
      .catch(() => {});

    // Fetch consultants
    fetch("/api/admin/users?role=admin,consultant")
      .then((r) => r.json())
      .then((d) => setConsultants(d.data ?? []))
      .catch(() => {});
  }, [isOpen]);

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    if (key === "businessName" || key === "contactName" || key === "contactEmail") {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async () => {
    const errs: { businessName?: string; contactName?: string; contactEmail?: string } = {};
    if (!form.businessName.trim()) errs.businessName = "Business name is required";
    if (!form.contactName.trim()) errs.contactName = "Contact name is required";
    if (!form.contactEmail.trim()) {
      errs.contactEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errs.contactEmail = "Enter a valid email address";
    }
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        source: "manual",
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.companySize) payload.companySize = form.companySize;
      if (form.revenueRange) payload.revenueRange = form.revenueRange;
      if (form.primaryChallenge.trim()) payload.primaryChallenge = form.primaryChallenge.trim();
      if (form.dealValue.trim()) payload.dealValue = Math.round(parseFloat(form.dealValue) * 100);
      if (form.assignedConsultant) payload.assignedConsultant = form.assignedConsultant;

      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create prospect");
      onCreated(json.data);
      setForm({
        businessName: "",
        contactName: "",
        contactEmail: "",
        phone: "",
        companySize: "",
        revenueRange: "",
        primaryChallenge: "",
        dealValue: "",
        assignedConsultant: "",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all";

  const handleClose = () => {
    setFieldErrors({});
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add prospect"
      size="md"
      footer={
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={saving}>
              Add prospect
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Business name *"
          placeholder="e.g. CloudScale Systems"
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          error={fieldErrors.businessName}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Contact name *"
            placeholder="e.g. Sarah Chen"
            value={form.contactName}
            onChange={(e) => update("contactName", e.target.value)}
            error={fieldErrors.contactName}
          />
          <Input
            label="Email *"
            type="email"
            placeholder="e.g. sarah@example.com"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            error={fieldErrors.contactEmail}
          />
        </div>
        <Input
          label="Phone"
          placeholder="e.g. 07700 900000"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-navy">Company size</label>
            <select
              value={form.companySize}
              onChange={(e) => update("companySize", e.target.value)}
              className={selectClass}
            >
              {COMPANY_SIZES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-navy">Revenue range</label>
            <select
              value={form.revenueRange}
              onChange={(e) => update("revenueRange", e.target.value)}
              className={selectClass}
            >
              {REVENUE_RANGES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Primary challenge"
          placeholder="e.g. Scaling sales process"
          value={form.primaryChallenge}
          onChange={(e) => update("primaryChallenge", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Deal value (£)"
            type="number"
            placeholder="e.g. 8500"
            value={form.dealValue}
            onChange={(e) => update("dealValue", e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-navy">Assign to</label>
            <select
              value={form.assignedConsultant}
              onChange={(e) => update("assignedConsultant", e.target.value)}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {consultants.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
