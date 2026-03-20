/**
 * Hiring Plan calculation engine.
 * Copied from the approved prototype — do not modify logic.
 */

export interface Hire {
  id: string
  role: string
  department: string
  startMonth: number
  salary: number
  revenueContribution: number
  rampMonths: number
  hiringCost: number
}

export interface HiringBase {
  monthlyRevenue:        number
  grossMarginPct:        number
  existingPeopleMonthly: number
  monthlyOverheads:      number
}

export interface MonthResult {
  month:            number
  label:            string
  totalRevenue:     number
  revenueFromHires: number
  grossProfit:      number
  newPeopleCost:    number
  totalPeople:      number
  hiringCosts:      number
  totalOverheads:   number
  ebitda:           number
  ebitdaMargin:     number
  headcount:        number
  activeHires:      Hire[]
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const num = (v: unknown) => parseFloat(String(v)) || 0

export function buildMonthlyPL(base: HiringBase, hires: Hire[]): MonthResult[] {
  return Array.from({ length: 12 }, (_, mi) => {
    const month = mi + 1
    const activeHires = hires.filter(h => num(h.startMonth) <= month)

    const newPeopleCost = activeHires.reduce((sum, h) => {
      const m = num(h.salary) / 12
      return sum + m + m * 0.138 + m * 0.03
    }, 0)

    const hiringCosts = hires
      .filter(h => num(h.startMonth) === month)
      .reduce((sum, h) => sum + num(h.hiringCost), 0)

    const revenueFromHires = activeHires.reduce((sum, h) => {
      const monthsActive = month - num(h.startMonth) + 1
      const ramp = Math.min(monthsActive / Math.max(num(h.rampMonths), 1), 1)
      return sum + num(h.revenueContribution) * ramp
    }, 0)

    const totalRevenue   = base.monthlyRevenue + revenueFromHires
    const grossProfit    = totalRevenue * (base.grossMarginPct / 100)
    const totalPeople    = base.existingPeopleMonthly + newPeopleCost
    const totalOverheads = base.monthlyOverheads + hiringCosts
    const ebitda         = grossProfit - totalPeople - totalOverheads
    const ebitdaMargin   = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0

    return {
      month, label: MONTHS[mi],
      totalRevenue, revenueFromHires, grossProfit,
      newPeopleCost, totalPeople,
      hiringCosts, totalOverheads,
      ebitda, ebitdaMargin,
      headcount: activeHires.length,
      activeHires,
    }
  })
}

export function calcHireMonthlyCost(salary: number): number {
  const m = salary / 12
  return m + m * 0.138 + m * 0.03
}

export function calcBreakEven(hire: Hire, grossMarginPct: number): number | null {
  const monthlyCost = calcHireMonthlyCost(num(hire.salary))
  const grossContrib = num(hire.revenueContribution) * (grossMarginPct / 100)
  let cumulativeCost = num(hire.hiringCost)
  let cumulativeRevenue = 0

  for (let mo = 1; mo <= 24; mo++) {
    cumulativeCost += monthlyCost
    const rampFactor = Math.min(mo / Math.max(num(hire.rampMonths), 1), 1)
    cumulativeRevenue += grossContrib * rampFactor
    if (cumulativeRevenue >= cumulativeCost) return mo + num(hire.startMonth) - 1
  }
  return null
}
