import {
  CRAWLER_BD,
  INDEXER_DB,
  waitForMongooseInstancesConnected,
} from "../shared/common/mongooseConnector.js";
import { globalWebSiteRanking } from "./function/pageRanking.js";

async function main() {
  // await Mongoose connection
  await waitForMongooseInstancesConnected([INDEXER_DB, CRAWLER_BD]);
  console.log("Mongoose instances connected\n");

  const laucnpageRanking = process.argv.includes("calcul_rank");
  if (laucnpageRanking) {
    console.log("Starting ranking algorithm");
    // initalisation du page ranking
    await globalWebSiteRanking(20);
    console.log("page rank settled");
  }

  // await startIndexing();
  process.exit(0);
}
main();
