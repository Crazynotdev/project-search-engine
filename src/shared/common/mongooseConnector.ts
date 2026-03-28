import mongoose, { type Connection } from "mongoose";
import { env } from "node:process";
import * as dotenv from "dotenv";
dotenv.config();

export const INDEXER_DB = mongoose.createConnection(
  env.INDEXER_MONGO_URI as string,
);

export const CRAWLER_BD = mongoose.createConnection(
  env.CRAWLER_MONGO_URI as string,
);

export const waitForMongooseInstancesConnected = async (
  conns: Connection[],
) => {
  const result = await Promise.all(
    conns.map((conn) => waitForConnection(conn)),
  );
};

async function waitForConnection(conn: Connection) {
  return await new Promise((res, rej) => {
    conn.once("connected", res);
    conn.once("error", rej);
  });
}
