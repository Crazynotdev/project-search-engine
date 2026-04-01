import mongoose, { Types } from "mongoose";
import { CRAWLER_BD } from "../common/mongooseConnector.js";

const linkSchema = new mongoose.Schema({
  source_page_id: { type: Types.ObjectId, ref: "pages", required: true },
  target_page_id: { type: Types.ObjectId, ref: "pages", required: true },
});

linkSchema.index({ source_page_id: 1, target_page_id: 1 }, { unique: true });

export const LinkModel = CRAWLER_BD.model("links", linkSchema);
