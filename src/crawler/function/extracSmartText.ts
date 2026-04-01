import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import type { Cheerio, CheerioAPI } from "cheerio";

export function extractSmartText($: CheerioAPI, html: string) {
  let result: {
    title: string | null;
    meta_description: string | null;
    main_content: string | null;
    word_count: number;
  } = {
    title: null,
    meta_description: null,
    main_content: null,
    word_count: 0,
  };

  // 1. Extraire le titre
  result.title =
    $("title").text().trim() || $("h1").first().text().trim() || "";
  result.meta_description =
    $("meta[name='description']").attr("content") ?? null;
  // 2. Tentative avec Readability (le plus précis)
  try {
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (article && article.textContent && article.textContent.length > 200) {
      result.main_content = article.textContent.toLowerCase();
      result.word_count = result.main_content.split(/\s+/).length;
      return result;
    }
  } catch (e) {
    // Fallback sur la méthode manuelle
  }

  // 3. Fallback : méthode manuelle
  const $body = $("body").clone();

  // Garder uniquement les éléments de contenu
  $body
    .find("script, style, noscript, iframe, svg, canvas, video, audio")
    .remove();

  // Supprimer les éléments de navigation courants
  $body
    .find("nav, header, footer, aside, .sidebar, .menu, .navigation, .ads")
    .remove();

  // Nettoyer les attributs
  $body.find("*").removeAttr("class id style");

  // Extraire par blocs
  let contentBlocks: string[] = [];

  $body.find("p, h1, h2, h3, h4, h5, h6, li, blockquote").each((i, elem) => {
    let text = $(elem).text().trim().toLowerCase();
    contentBlocks.push(text);
  });

  result.main_content = contentBlocks.join("\n\n");
  result.word_count = result.main_content.split(/\s+/).length;

  return result;
}
