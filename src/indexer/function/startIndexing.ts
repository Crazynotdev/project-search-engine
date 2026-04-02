import { PageModel } from "../../shared/models/page.js";
import { removeStopwords, fra, eng } from "stopword";
import { calculScore } from "./calculScore.js";
import { IndexerModel } from "../../shared/models/index.js";
import pLimit from "p-limit";
import { PageContentModel } from "../../shared/models/pageContent.js";
import { chunkArray } from "./chunkArray.js";
import { Types } from "mongoose";

export async function startIndexing() {
  const pages = await PageModel.find({}, { _id: 1, url: 1, rank: 1 });
  const pages_content = await PageContentModel.find(
    {},
    { page_id: 1, clean_text: 1, word_count: 1 },
  );

  const pagesMap = new Map<string, { rank: number; word_count: number }>(
    pages.map((s) => [
      s._id.toString(),
      {
        rank: s.rank!,
        word_count: 0,
      },
    ]),
  );

  // Stocker la liste des mots , et les pages les incluants
  const wordsMap = new Map<string, Map<string, number>>();

  for (let i = 0; i < pages_content.length; i++) {
    const content = pages_content[i]!;
    // On ajoute des donnees au ajour le pageMap
    pagesMap.get(content.page_id.toString())!.word_count = content.word_count;

    const wordsSet = new Set(
      removeStopwords(
        content.clean_text?.split(" ").filter((p) => p.length !== 0) ?? [],
        [...fra, ...eng],
      ),
    );
    for (const w of wordsSet) {
      if (!wordsMap.has(w)) {
        wordsMap.set(w, new Map());
      }

      const pageMap = wordsMap.get(w)!;
      const prev = pageMap.get(content.page_id.toString()) ?? 0;
      pageMap.set(content.page_id.toString(), prev + 1);
    }
  }

  console.log("Starting Indexing");
  const chunkWords = chunkArray(Array.from(wordsMap.keys()), 100);

  // ///////////////////////
  // Test
  // const scoreMap = new Map<string, { page_id: string; score: number }[]>();
  // const word: string = Array.from(wordsMap.keys())[0]!;
  // const [page_id, page] = Array.from(pagesMap.entries())[0]!;
  // wordIndexer(word, page_id, wordsMap, pagesMap, scoreMap);

  // return;

  ////////////////////////////////

  const limit = pLimit(500);
  for (const chunk of chunkWords) {
    const scoreMap = new Map<string, { page_id: string; score: number }[]>();

    // Calcule du score
    await Promise.all(
      chunk.flatMap((w) => {
        const pagesWithWords = wordsMap.get(w)!.keys();
        return Array.from(pagesWithWords).map((p) =>
          limit(() => wordIndexer(w, p, wordsMap, pagesMap, scoreMap)),
        );
      }),
    );

    // Sauvegarde dans la base de donnees des indexes
    const saveData = Array.from(scoreMap.entries());
    await IndexerModel.bulkWrite(
      //@ts-ignore
      saveData.map(([word, score]) => ({
        updateOne: {
          filter: { word },
          update: {
            $set: {
              urls: score.map((s) => ({
                page_id: new Types.ObjectId(s.page_id),
                score: s.score,
              })),
            },
          },
          upsert: true,
        },
      })),
    );
  }
}

async function wordIndexer(
  word: string,
  page_id: string,
  wordsMap: Map<string, Map<string, number>>,
  pagesMap: Map<string, { rank: number; word_count: number }>,
  scoreMap: Map<string, { page_id: string; score: number }[]>,
) {
  const wordOcurr = wordsMap.get(word)!.get(page_id)!;
  const page_words_count = pagesMap.get(page_id)!.word_count;
  const docs_containing_word_length = wordsMap.get(word)!.size;
  const totalDocs = pagesMap.size;
  const pageRank = pagesMap.get(page_id)!.rank;

  const score = calculScore(
    wordOcurr,
    page_words_count,
    docs_containing_word_length,
    totalDocs,
    pageRank,
  );

  if (isNaN(score))
    throw Error("Error on calculating score", {
      cause: {
        word,
        page_id,
        wordOcurr,
        page_words_count,
        docs_containing_word_length,
        totalDocs,
        pageRank,
        wordsMap: wordsMap.get(word)!,
      },
    });
  if (!scoreMap.has(word)) scoreMap.set(word, []);
  scoreMap.get(word)!.push({ page_id: page_id.toString(), score });
}
