import { WebSiteModel } from "../../shared/models/websites.js";
import { removeStopwords, fra, eng } from "stopword";

export async function startIndexing() {
  console.log("Starting Indexing");
  // We get the page
  const cursor = WebSiteModel.find({}).cursor();
  for (
    let website = await cursor.next();
    website !== null;
    website = await cursor.next()
  ) {
    console.log("Current Url : " + website.link);
    // Transformer text
    const content = website.content
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");

    const wordsList = removeStopwords(content.split(" "), [...fra, ...eng]);
    console.log("Founded word List : " + wordsList.length);
    for (const word of wordsList) {
      console.log("Fetching Links for words : " + word);
      //Chercher tous les liens contetans le mots
      const urls = await WebSiteModel.find({
        content: { $regex: word, $options: "i" },
      });

      console.log("word : " + word + " urls : " + urls.length);
      break;
    }
    break;
  }
}
