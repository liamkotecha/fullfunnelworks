/**
 * generateClientReport — creates a branded PDF for a client engagement.
 * Uses @react-pdf/renderer for server-side PDF generation without a browser.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// ── Types ─────────────────────────────────────────────────────

export interface ReportData {
  client: {
    businessName: string;
    contactName?: string;
    website?: string;
  };
  project: {
    title: string;
    createdAt: string;
    completedAt?: string;
    assignedConsultantName?: string;
  };
  sections: ReportSection[];
  financialSummary?: FinancialSummary | null;
  includeNotes: boolean;
  notes?: Record<string, string>; // fieldId → note
}

export interface ReportSection {
  sectionLabel: string;
  subSections: {
    subSectionLabel: string;
    fields: {
      fieldId: string;
      question: string;
      answer: string | null;
      note?: string;
    }[];
  }[];
}

export interface FinancialSummary {
  monthlyRevenue: number;
  grossMarginPct: number;
  monthlyPeople: number;
  monthlyOverheads: number;
  netProfit: number;
}

// ── Styles ────────────────────────────────────────────────────

const NAVY = "#0F1F3D";
const GOLD = "#C9A84C";
const AMBER_BG = "#FFFBEB";
const AMBER_BORDER = "#F59E0B";
const CREAM = "#FAFAF8";

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1E293B",
  },
  /* Cover page */
  coverPage: {
    paddingHorizontal: 40,
    paddingVertical: 60,
    fontFamily: "Helvetica",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  brandName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    letterSpacing: 3,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 9,
    color: "#94A3B8",
    marginBottom: 60,
  },
  coverTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textAlign: "center",
    marginBottom: 8,
  },
  coverClient: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 9,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 4,
  },
  /* TOC */
  tocTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 4,
  },
  tocItem: {
    fontSize: 10,
    marginBottom: 6,
    color: "#475569",
  },
  /* Sections */
  sectionHeader: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 4,
    marginTop: 16,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 4,
  },
  subSectionHeader: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
    marginBottom: 6,
    marginTop: 10,
  },
  /* Fields */
  fieldBlock: {
    marginBottom: 10,
  },
  question: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  answer: {
    fontSize: 10,
    color: "#1E293B",
    backgroundColor: CREAM,
    padding: 8,
    borderRadius: 3,
    lineHeight: 1.5,
  },
  notAnswered: {
    fontSize: 10,
    color: "#94A3B8",
    fontStyle: "italic",
    padding: 8,
  },
  /* Notes */
  noteBox: {
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: AMBER_BORDER,
    backgroundColor: AMBER_BG,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
  },
  noteLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 9,
    color: "#78350F",
    lineHeight: 1.4,
  },
  /* Financial */
  finTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 4,
  },
  finRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  finLabel: {
    fontSize: 10,
    color: "#475569",
  },
  finValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1E293B",
  },
  finNetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: NAVY,
  },
  finNetLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  finNetValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  /* Footer */
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#94A3B8",
  },
});

// ── Helpers ───────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

// ── Footer Component ──────────────────────────────────────────

function Footer({ date }: { date: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Confidential — Full Funnel Works</Text>
      <Text style={styles.footerText}>{date}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// ── PDF Document ──────────────────────────────────────────────

function ClientReportDocument({ data }: { data: ReportData }) {
  const today = formatDate(new Date().toISOString());

  return (
    <Document
      title={`${data.client.businessName} — Growth Strategy Report`}
      author="Full Funnel Works"
    >
      {/* Cover page */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.brandName}>FULL FUNNEL</Text>
        <Text style={styles.brandSub}>Growth Strategy Framework</Text>
        <Text style={styles.coverTitle}>Growth Strategy Report</Text>
        <Text style={styles.coverClient}>{data.client.businessName}</Text>
        {data.project.assignedConsultantName && (
          <Text style={styles.coverMeta}>
            Consultant: {data.project.assignedConsultantName}
          </Text>
        )}
        <Text style={styles.coverMeta}>
          Generated: {today}
        </Text>
        {data.project.createdAt && (
          <Text style={styles.coverMeta}>
            Engagement started: {formatDate(data.project.createdAt)}
          </Text>
        )}
      </Page>

      {/* Table of contents */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        {data.sections.map((section, i) => (
          <Text key={i} style={styles.tocItem}>
            {i + 1}. {section.sectionLabel}
          </Text>
        ))}
        {data.financialSummary && (
          <Text style={styles.tocItem}>
            {data.sections.length + 1}. Financial Summary
          </Text>
        )}
        <Footer date={today} />
      </Page>

      {/* Section pages */}
      {data.sections.map((section, si) => (
        <Page key={si} size="A4" style={styles.page} wrap>
          <Text style={styles.sectionHeader}>{section.sectionLabel}</Text>

          {section.subSections.map((sub, subi) => (
            <View key={subi} wrap={false}>
              <Text style={styles.subSectionHeader}>{sub.subSectionLabel}</Text>
              {sub.fields.map((field, fi) => (
                <View key={fi} style={styles.fieldBlock} wrap={false}>
                  <Text style={styles.question}>{field.question}</Text>
                  {field.answer ? (
                    <Text style={styles.answer}>{field.answer}</Text>
                  ) : (
                    <Text style={styles.notAnswered}>Not completed</Text>
                  )}
                  {data.includeNotes && field.note && (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteLabel}>Consultant Note</Text>
                      <Text style={styles.noteText}>{field.note}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))}

          <Footer date={today} />
        </Page>
      ))}

      {/* Financial summary page */}
      {data.financialSummary && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.finTitle}>Financial Summary</Text>

          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Monthly Revenue</Text>
            <Text style={styles.finValue}>
              {formatCurrency(data.financialSummary.monthlyRevenue)}
            </Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Gross Margin</Text>
            <Text style={styles.finValue}>
              {data.financialSummary.grossMarginPct}%
            </Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Monthly People Cost</Text>
            <Text style={styles.finValue}>
              {formatCurrency(data.financialSummary.monthlyPeople)}
            </Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Monthly Overheads</Text>
            <Text style={styles.finValue}>
              {formatCurrency(data.financialSummary.monthlyOverheads)}
            </Text>
          </View>
          <View style={styles.finNetRow}>
            <Text style={styles.finNetLabel}>Net Profit (Monthly)</Text>
            <Text style={styles.finNetValue}>
              {formatCurrency(data.financialSummary.netProfit)}
            </Text>
          </View>

          <Footer date={today} />
        </Page>
      )}
    </Document>
  );
}

// ── Main export ───────────────────────────────────────────────

export async function generateClientReport(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <ClientReportDocument data={data} /> as any
  );
  return Buffer.from(buffer);
}
