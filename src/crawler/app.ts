import mongoose from "mongoose";
import { env } from "node:process";
import dotenv from "dotenv";
import { fetcher } from "./function/fetcher.js";
import { CrawlQueueWebSiteModel } from "../shared/models/crawl_queue_websites.js";
import { WebSiteModel } from "../shared/models/websites.js";
import path from "node:path";
import NodeCache from "node-cache";
import { PolitnessCrawl } from "./function/PolitnessCrawl.js";
dotenv.config({ path: path.join(import.meta.dirname, "../../.env") });

const startUrl =
  "https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal";

const cached_queue = new Set<string>();
const host_last_crawl = new NodeCache({ stdTTL: 5, checkperiod: 5 });
let active_crawling_process: number = 0;

async function main() {
  // Connect to mongoose
  await mongoose.connect(env.CRAWLER_MONGO_URI as string);
  console.log("Connected to mongoose\n\nLauching Crawl");

  crawl();
}

main();

async function crawl() {
  if (cached_queue.size == 0) {
    const db_queue = await CrawlQueueWebSiteModel.find().limit(100);
    // Save the chached_queue
    if (db_queue.length > 0) {
      db_queue.forEach((website) => {
        cached_queue.add(website.url);
      });

      // Delete from database
      await CrawlQueueWebSiteModel.deleteMany({
        _id: { $in: db_queue.map((q) => q._id) },
      });

      // Relancement de l'instance
      return crawl();
    }
  }

  // Check if reached multipleCrawlLimit
  if (active_crawling_process >= parseInt(env.MAX_SYNC_CRWAL as string)) return;

  const urlToScrapp =
    cached_queue.size > 0
      ? PolitnessCrawl.getOldest(Array.from(cached_queue))
      : startUrl;
  cached_queue.delete(urlToScrapp);

  try {
    // Add starting crawl
    active_crawling_process++;

    // Check if scrapped url
    const scrappedUrl = await WebSiteModel.findOne({ link: urlToScrapp });
    if (scrappedUrl) return;

    const response = await fetcher(urlToScrapp);
    await WebSiteModel.create({ link: urlToScrapp, ...response });

    // Insert new Url to Queue
    await Promise.all(
      response.urls.map((url) =>
        CrawlQueueWebSiteModel.updateOne(
          { url },
          { $setOnInsert: { url } },
          { upsert: true },
        ),
      ),
    );
    console.log("Url crawled : " + urlToScrapp);
  } catch (error) {
    console.error(
      "Failed to get url : " +
        urlToScrapp +
        " reason : " +
        (error as Error).message,
    );
  } finally {
    // Remove ended crawl
    active_crawling_process--;
    crawl();
  }
}
