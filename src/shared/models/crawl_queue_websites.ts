import mongoose, { Types } from "mongoose";
import { CRAWLER_BD } from "../common/mongooseConnector.js";

const crawlQueueWebsiteSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true, index: true },
  discovered_from: [{ type: Types.ObjectId, ref: "pages" }],
  reference_count: { type: Number, default: 0 },
});

export const CrawlQueueWebSiteModel = CRAWLER_BD.model(
  "crawl_queue_website",
  crawlQueueWebsiteSchema,
);
