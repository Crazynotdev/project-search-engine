import mongoose from "mongoose";
import { CRAWLER_BD } from "../common/mongooseConnector.js";

export const webSiteSchema = new mongoose.Schema({
  link: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  urls: { type: [String], default: [] },
});

export const WebSiteModel = CRAWLER_BD.model("websites", webSiteSchema);
