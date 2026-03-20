/**
 * P&L engine for the Financial Scenario Modeller.
 * Logic copied verbatim from the approved prototype — do not modify.
 */

export interface RevenueLine {
  id: string; name: string; price: number; volume: number; cogsPct: number;
}
export interface PeopleLine {
  id: string; name: string; salary: number; headcount: number; pensionPct: number;
}
export interface OverheadLine {
  id: string; name: string; amount: number; period: "monthly" | "annual";
}
export interface ModellerData {
  revenue: RevenueLine[]; people: PeopleLine[]; overheads: OverheadLine[];
}
export interface PLResult {
  revenueLines: (RevenueLine & { total: number; cogs: number })[];
  totalRevenue: number; totalCOGS: number;
  grossProfit: number; grossMargin: number;
  peopleLines: (PeopleLine & { ni: number; pension: number; total: number })[];
  totalPeople: number; totalPeopleMonthly: number;
  overheadLines: (OverheadLine & { total: number })[];
  totalOverheads: number;
  totalOpex: number;
  ebitda: number; ebitdaMargin: number;
  breakEven: number;
}

export function calcPL(data: ModellerData): PLResult {
  const num = (v: unknown) => parseFloat(String(v)) || 0

  const revenueLines = data.revenue.map(r => ({
    ...r,
    total: num(r.price) * num(r.volume),
    cogs:  num(r.price) * num(r.volume) * (num(r.cogsPct) / 100),
  }))
  const totalRevenue = revenueLines.reduce((s, r) => s + r.total, 0)
  const totalCOGS    = revenueLines.reduce((s, r) => s + r.cogs, 0)
  const grossProfit  = totalRevenue - totalCOGS
  const grossMargin  = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  const peopleLines = data.people.map(p => {
    const base    = num(p.salary)
    const ni      = base * 0.138
    const pension = base * num(p.pensionPct || 3) / 100
    const total   = (base + ni + pension) * num(p.headcount || 1)
    return { ...p, ni, pension, total }
  })
  const totalPeople        = peopleLines.reduce((s, p) => s + p.total, 0)
  const totalPeopleMonthly = totalPeople / 12

  const overheadLines = data.overheads.map(o => ({
    ...o,
    total: num(o.amount) * (o.period === "annual" ? 1/12 : 1),
  }))
  const totalOverheads = overheadLines.reduce((s, o) => s + o.total, 0)

  const totalOpex    = totalPeopleMonthly + totalOverheads
  const ebitda       = grossProfit - totalOpex
  const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0
  const breakEven    = grossMargin > 0 ? (totalOpex / (grossMargin / 100)) : 0

  return {
    revenueLines, totalRevenue, totalCOGS, grossProfit, grossMargin,
    peopleLines, totalPeople, totalPeopleMonthly,
    overheadLines, totalOverheads,
    totalOpex, ebitda, ebitdaMargin, breakEven,
  }
}
