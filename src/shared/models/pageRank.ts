import mongoose, { Types } from "mongoose";
import { CRAWLER_BD } from "../common/mongooseConnector.js";

const pageRankSchema = new mongoose.Schema({
  page_id: { type: Types.ObjectId, ref: "pages", required: true },
  score: { type: Number, required: true },
  last_calculated: { type: Date, default: Date.now },
  iterations: { type: Number, required: true },
});

export const PageRankSchema = CRAWLER_BD.model("page_ranks", pageRankSchema);
