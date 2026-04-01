import axios from "axios";
import { isAllowedToScrap, tryFiltreUnallowed } from "./CrawablePathChecker.js";
import * as Cheerio from "cheerio";
import { extractSmartText } from "./extracSmartText.js";

export async function fetcher(url: string) {
  const isAllowed = await isAllowedToScrap(url);
  if (!isAllowed) throw new Error("not allowed to scrap");

  const htmlContent = await axios.get(url, {
    responseType: "text",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });

  const $ = Cheerio.load(htmlContent.data);
  const extractResult = extractSmartText($, htmlContent.data);
  const urls: string[] = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) {
      const absoluteUrl = new URL(href, url).toString();
      urls.push(absoluteUrl);
    }
  });

  const filtredUrl = urls.filter(
    (u) => u.startsWith("http") && !u.endsWith(".pdf"),
  );

  return {
    title: extractResult.title,
    content:
      extractResult.main_content
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ") ?? null,
    meta_description: extractResult.meta_description,
    word_Count: extractResult.word_count,
    urls: filtredUrl,
    domain: new URL(url).origin,
    allowedToScrap: tryFiltreUnallowed(url, filtredUrl),
  };
}
