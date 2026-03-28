import mongoose from "mongoose";

export const crawlQueueWebsite = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
});

export const CrawlQueueWebSiteModel = mongoose.model(
  "crawl_queue_website",
  crawlQueueWebsite,
);
