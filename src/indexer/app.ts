import {
  CRAWLER_BD,
  INDEXER_DB,
  waitForMongooseInstancesConnected,
} from "../shared/common/mongooseConnector.js";
import { IndexerModel } from "../shared/models/index.js";
import { WebSiteModel } from "../shared/models/websites.js";
import { globalWebSiteRanking } from "./function/pageRanking.js";
import { startIndexing } from "./function/startIndexing.js";

async function main() {
  // await Mongoose connection
  await waitForMongooseInstancesConnected([INDEXER_DB, CRAWLER_BD]);
  console.log("Mongoose instances connected\n");

  const exists = true //await WebSiteModel.findOne({ rank: { $exists: false } });
  if (exists) {
    console.log("existing not ranked pages\nStarting ranking algorithm")
    // initalisation du page ranking
    await globalWebSiteRanking(20);
    console.log("page rank settled")
  }

  // startIndexing();
}
main();
