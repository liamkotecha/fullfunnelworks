import mongoose, { Schema } from "mongoose"

const RevenueLineSchema = new Schema({
  id:       String,
  name:     String,
  price:    Number,
  volume:   Number,
  cogsPct:  Number,
}, { _id: false })

const PeopleLineSchema = new Schema({
  id:         String,
  name:       String,
  salary:     Number,
  headcount:  Number,
  pensionPct: Number,
}, { _id: false })

const OverheadLineSchema = new Schema({
  id:     String,
  name:   String,
  amount: Number,
  period: { type: String, enum: ["monthly", "annual"] },
}, { _id: false })

const ModellerBaseSchema = new Schema({
  clientId:  { type: Schema.Types.ObjectId, ref: "Client", required: true, unique: true },
  revenue:   [RevenueLineSchema],
  people:    [PeopleLineSchema],
  overheads: [OverheadLineSchema],
  updatedAt: { type: Date, default: Date.now },
})

ModellerBaseSchema.index({ clientId: 1 }, { unique: true })

export { RevenueLineSchema, PeopleLineSchema, OverheadLineSchema }
export default mongoose.models.ModellerBase || mongoose.model("ModellerBase", ModellerBaseSchema)
