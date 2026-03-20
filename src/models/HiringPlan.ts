import mongoose, { Schema } from "mongoose"

const HireSchema = new Schema({
  id:                  String,
  role:                String,
  department:          String,
  startMonth:          Number,
  salary:              Number,
  revenueContribution: Number,
  rampMonths:          Number,
  hiringCost:          Number,
}, { _id: false })

const HiringPlanSchema = new Schema({
  clientId:     { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
  hires:        [HireSchema],
  useModeller:  { type: Boolean, default: true },
  baseOverride: {
    monthlyRevenue:        Number,
    grossMarginPct:        Number,
    existingPeopleMonthly: Number,
    monthlyOverheads:      Number,
  },
  updatedAt: { type: Date, default: Date.now },
})

HiringPlanSchema.index({ clientId: 1 }, { unique: true })

export default mongoose.models.HiringPlan || mongoose.model("HiringPlan", HiringPlanSchema)
