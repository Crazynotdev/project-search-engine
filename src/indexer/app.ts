import {
  CRAWLER_BD,
  INDEXER_DB,
  waitForMongooseInstancesConnected,
} from "../shared/common/mongooseConnector.js";
import { IndexerModel } from "../shared/models/index.js";
import { startIndexing } from "./function/startIndexing.js";

async function main() {
  // await Mongoose connection
  await waitForMongooseInstancesConnected([INDEXER_DB, CRAWLER_BD]);
  console.log("Mongoose instances connected\n");

  startIndexing();
}
main();
