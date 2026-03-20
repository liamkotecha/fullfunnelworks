import mongoose, { Schema } from "mongoose"
import { RevenueLineSchema, PeopleLineSchema, OverheadLineSchema } from "./ModellerBase"

const ModellerScenarioSchema = new Schema({
  clientId:    { type: Schema.Types.ObjectId, ref: "Client", required: true },
  name:        { type: String, default: "New scenario" },
  description: String,
  type:        { type: String, enum: ["hire", "price", "revenue", "client"] },
  data: {
    revenue:   [RevenueLineSchema],
    people:    [PeopleLineSchema],
    overheads: [OverheadLineSchema],
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

ModellerScenarioSchema.index({ clientId: 1 })

export default mongoose.models.ModellerScenario || mongoose.model("ModellerScenario", ModellerScenarioSchema)
