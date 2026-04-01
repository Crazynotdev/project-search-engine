import { PageModel } from "../../shared/models/page.js";
import { tfIdf } from "./tfIdf.js";

// score = 0.7 * TF-IDF + 0.3 * PageRank
export async function calculScore(
  word: string,
  webpageScoreMapList: Map<string, { link: string; score: number }[]>,
  urls: string[],
  totalDocsLength: number,
  websiteListMap: Map<string, { rank: number }>,
) {
  await Promise.all(
    urls.map(async (u) => {
      const contents =
        (await PageModel.findOne({ link: u }, { content: 1 }))?.content
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, " ")
          .split(" ") || [];

      const tf = tfIdf(word, contents, urls.length, totalDocsLength);

      webpageScoreMapList.get(word)?.push({
        link: u,
        score: 0.7 * tf + 0.3 * websiteListMap.get(u)!.rank!,
      });
    }),
  );
}
