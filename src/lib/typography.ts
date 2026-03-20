/**
 * Typography system
 *
 * Font roles:
 *   Josefin Sans (font-display / font-serif) → headings, labels, nav, badges
 *   Inter        (font-sans)                 → body copy, descriptions, form text
 *
 * Usage: import { t } from "@/lib/typography"
 *   <h1 className={t.h1}>...</h1>
 *   <p  className={t.body}>...</p>
 */

export const t = {
  /** Page-level hero title — Josefin Sans 3xl bold */
  display: "type-display",

  /** Primary section title — Josefin Sans 2xl bold */
  h1: "type-h1",

  /** Card / panel header — Josefin Sans xl semibold */
  h2: "type-h2",

  /** Sub-section header — Josefin Sans lg semibold */
  h3: "type-h3",

  /** Overline / step label — Josefin Sans xs bold uppercase tracking-widest */
  h4: "type-h4",

  /** Standard body copy — Inter 15px normal */
  body: "type-body",

  /** Secondary description text — Inter sm slate-600 */
  bodySm: "type-body-sm",

  /** Emphasised body copy — Inter 15px semibold */
  bodyStrong: "type-body-strong",

  /** Timestamps, footnotes, meta — Inter xs slate-500 */
  caption: "type-caption",

  /** Form labels, table headers, sidebar nav — Josefin Sans xs semibold uppercase */
  label: "type-label",

  /** Disabled / placeholder text — Inter sm slate-400 */
  muted: "type-muted",
} as const;

export type TypographyKey = keyof typeof t;
