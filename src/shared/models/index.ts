import mongoose from "mongoose";
import { INDEXER_DB } from "../common/mongooseConnector.js";

const IndexSchema = new mongoose.Schema({
  word: { type: String, required: true },
  urls: { type: [{ link: String, scrore: Number }], default: [] },
});

IndexSchema.index({ word: 1 });

export const IndexerModel = INDEXER_DB.model("reverse_indexes", IndexSchema);
