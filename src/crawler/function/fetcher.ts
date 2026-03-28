import axios from "axios";
import { isAllowedToScrap, tryFiltreUnallowed } from "./CrawablePathChecker.js";
import * as Cheerio from "cheerio";

export async function fetcher(url: string): Promise<{
  title: string;
  urls: string[];
  content: string;
  allowedToScrap: string[];
}> {
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
  const title = $("head > title").text() as string;
  const content = $("body").remove("script style noscript").text() as string;
  const urls: string[] = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) {
      const absoluteUrl = new URL(href, url).toString();
      urls.push(absoluteUrl);
    }
  });

  const filtredUrl = urls.filter((u) => u.startsWith("http"));

  return {
    title,
    content,
    urls: filtredUrl,
    allowedToScrap: tryFiltreUnallowed(url, filtredUrl),
  };
}
