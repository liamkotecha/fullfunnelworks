/**
 * Default base model data for new clients.
 */
import type { ModellerData } from "./calc"

let _counter = 0
function uid() { return `default-${++_counter}-${Date.now().toString(36)}` }

export const defaultBase: ModellerData = {
  revenue: [
    { id: uid(), name: "Core product / service", price: 5000, volume: 8, cogsPct: 20 },
    { id: uid(), name: "Retainer clients",       price: 2500, volume: 4, cogsPct: 10 },
  ],
  people: [
    { id: uid(), name: "Directors (×2)",   salary: 80000, headcount: 2, pensionPct: 5 },
    { id: uid(), name: "Account Managers", salary: 35000, headcount: 2, pensionPct: 3 },
    { id: uid(), name: "Operations",       salary: 28000, headcount: 1, pensionPct: 3 },
  ],
  overheads: [
    { id: uid(), name: "Office & facilities", amount: 3500, period: "monthly" },
    { id: uid(), name: "Software & tools",    amount: 1200, period: "monthly" },
    { id: uid(), name: "Marketing",           amount: 2000, period: "monthly" },
    { id: uid(), name: "Professional fees",   amount: 18000, period: "annual" },
  ],
}
