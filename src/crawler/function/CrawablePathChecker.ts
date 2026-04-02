import axios, { AxiosError } from "axios";
import NodeCache from "node-cache";
import path from "node:path";
import robotsParser from "robots-parser";

// Cache robots.txt temp
const robots_txt_caches = new NodeCache({
  stdTTL: 60 * 60 * 5,
  checkperiod: 300,
});

export async function isAllowedToScrap(url: string) {
  const urlObject = new URL(url);

  let robotTxtTextContent: string | null = null;
  if (robots_txt_caches.has(urlObject.origin)) {
    robotTxtTextContent = robots_txt_caches.get<string>(urlObject.origin)!;
  } else {
    try {
      const result = await axios.get(urlObject.origin + "/robots.txt", {
        responseType: "text",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      robotTxtTextContent = result.data as string;
      robots_txt_caches.set(urlObject.origin, result.data);
    } catch (error) {
      if (!(error instanceof AxiosError)) {
        throw error;
      }

      //save empty string in cache
      console.log("no robot.txt found for : " + urlObject.origin);
      robotTxtTextContent = "";
      robots_txt_caches.set(urlObject.origin, "");
    }

    if (robotTxtTextContent.length == 0) return true;

    //@ts-ignore
    const robot = robotsParser(urlObject.origin, robotTxtTextContent);
    return !robot.isDisallowed(url, "*") as boolean;
  }
}

export function tryFiltreUnallowed(url: string, paths: string[]) {
  const urlObject = new URL(url);
  const existsTxtCaches = robots_txt_caches.get<string>(urlObject.origin);
  if (!existsTxtCaches) return paths;
  //@ts-ignore
  const robot = robotsParser(urlObject.origin, existsTxtCaches);
  return paths.filter((url) => {
    const pathObject = new URL(url);
    if (pathObject.origin !== urlObject.origin) return true;
    if (robot.isDisallowed(url, "*")) return false;
    return true;
  });
}
