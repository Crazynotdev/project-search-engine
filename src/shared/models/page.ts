import mongoose from "mongoose";
import { CRAWLER_BD } from "../common/mongooseConnector.js";
import type { url } from "node:inspector";

export const pageSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  title: { type: String },
  domain: { type: String, required: true },
  crawled_at: { type: Date, default: Date.now },
  rank: { type: Number },
});

export const PageModel = CRAWLER_BD.model("pages", pageSchema);
