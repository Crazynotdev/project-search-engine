import { PageModel } from "../../shared/models/page.js";
import { removeStopwords, fra, eng } from "stopword";
import { calculScore } from "./calculScore.js";
import { IndexerModel } from "../../shared/models/index.js";
import pLimit from "p-limit";

export async function startIndexing() {
  const websiteList = await PageModel.find({}, { _id: 0, link: 1, rank: 1 });

  const websiteListMap = new Map(
    websiteList.map((s) => [
      s.link,
      {
        rank: s.rank!,
      },
    ]),
  );
  const globalWordListScore = await IndexerModel.find({}, { _id: 0, word: 1 });
  const globalWordListScoreSet = new Set(
    globalWordListScore.map((w) => w.word),
  );

  console.log("Starting Indexing");
  // We get the page
  const cursor = PageModel.find({}).cursor();
  let i = 1;
  for (
    let website = await cursor.next();
    website !== null;
    website = await cursor.next()
  ) {
    console.log("indexing " + i + "/" + websiteList.length);
    // Transformer text
    const content = website.content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");
    // On retire les stopsWords et les mots deja indexees
    const wordsList = new Set(
      removeStopwords(
        content.split(" ").filter((w) => !globalWordListScoreSet.has(w)),
        [...fra, ...eng],
      ),
    );

    console.log("words : " + wordsList.size);

    const wordsMapList = new Map<string, { link: string; score: number }[]>(
      Array.from(wordsList).map((w) => [w, []]),
    );

    for (const w of Array.from(wordsList)) {
      console.log("scoring : ", w);
      await wordIndexer(w, wordsMapList, websiteListMap, websiteList.length);
    }

    await IndexerModel.bulkWrite(
      Array.from(wordsMapList).map(([word, score]) => {
        globalWordListScoreSet.add(word);
        return {
          updateOne: {
            filter: { word },
            update: {
              $set: {
                urls: score,
              },
            },
            upsert: true,
          },
        };
      }),
    );

    i++;
  }
}

async function wordIndexer(
  word: string,
  wordListMap: Map<string, { link: string; score: number }[]>,
  WebListListMap: Map<
    string,
    {
      rank: number;
    }
  >,
  totalDocLength: number,
) {
  const urls = await PageModel.find(
    {
      content: { $regex: word, $options: "i" },
    },
    { _id: 0, link: 1 },
  );

  await calculScore(
    word,
    wordListMap,
    urls.map((p) => p.link),
    totalDocLength,
    WebListListMap,
  );
}
