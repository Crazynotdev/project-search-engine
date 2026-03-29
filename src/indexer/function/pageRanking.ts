// import { WebSiteModel } from "../../shared/models/websites.js";
// import { chunkArray } from "./chunkArray.js";
// import pLimit from "p-limit";
// import { createLogger } from "./createLogger.js";

// type Page = { rank?: number | null, urls: string[], link: string }

// /**
//  * 
//  * @param iterations - nombre d'iteration pour stabiliser le rang
//  * @param d - Damping factor
//  * 
//  * @description Le PageRank[a] ou PR est l'algorithme d'analyse des liens concourant au système de classement des pages Web utilisé par le moteur de recherche Google. Il mesure quantitativement la popularité d'une page web. Le PageRank n'est qu'un indicateur parmi d'autres dans l'algorithme qui permet de classer les pages du Web dans les résultats de recherche de Google. Ce système a été inventé par Larry Page, cofondateur de Google[1]. Ce mot est une marque déposée. <source: WIKIPEDIA>
//  */
// export async function globalWebSiteRanking(iterations: number, d: number = 0.85) {

//     // On recupere la liste des pages
//     const pages = await WebSiteModel.find({}, { _id: 0, rank: 1, link: 1, urls: 1 });
//     const pageMap = new Map(pages.map(p => [p.link, { ...p, rank: p.rank ?? 1 / pages.length }]));
//     const unscoredPages = pages.filter(p => !p.rank)
//     console.log(unscoredPages.length + " retrouveés sans score")

//     // 2. Boucle PageRank
//     // for (let iter = 0; iter < iterations; iter++) {
//     //     const newRank = new Map<string, number>();
//     //     let currentIndex = 1
//     //     for (const page of pages) {
//     //         let sum = 0;
//     //         for (const p of pages.filter(p => p.urls.includes(page.link))) {
//     //             sum += (pageMap.get(p.link)!.rank!) / p.urls.length;
//     //         }
//     //         const tempRank = (1 - d) / pages.length + d * sum
//     //         newRank.set(page.link, tempRank);
//     //         console.log(`[${iter + 1} - ${currentIndex}/${pages.length}] - rank : ${tempRank}`)
//     //         currentIndex++
//     //     }

//     //     // update ranks
//     //     pages.forEach(page => pageMap.get(page.link)!.rank = newRank.get(page.link)!)

//     // }

//     // await WebSiteModel.bulkWrite(Array.from(pages).map(page => ({
//     //     updateOne: {
//     //         filter: { link: page.link },
//     //         update: { $set: { rank: pageMap.get(page.link)!.rank } },
//     //         upsert: false
//     //     }
//     // })))

//     // Lancer plusieurs threat de calcule de pageScore
//     const chunkUnscoredPages = chunkArray(unscoredPages, 10);
//     const maxThreads = 5; // nombre max de threads/concurrent chunks
//     console.log(chunkUnscoredPages.length + " Chunks a calculer");

//     let index = 0;

//     async function runNextBatch() {
//         const batch = [];

//         // prendre jusqu'à maxThreads chunks
//         while (batch.length < maxThreads && index < chunkUnscoredPages.length) {
//             const i = index;
//             const chunk = chunkUnscoredPages[i];
//             batch.push(chunkRankingCalculator(chunk!, pageMap, pages, iterations, 0.85, i));
//             index++;
//         }

//         // attendre que ce batch soit terminé
//         await Promise.all(batch);

//         // si reste des chunks, relancer
//         if (index < chunkUnscoredPages.length) {
//             await runNextBatch();
//         }
//     }

//     // lancer le calcul
//     await runNextBatch();

//     console.log("Tous les chunks ont été calculés !");

//     // await Promise.all(
//     //     chunkUnscoredPages.map((chunk, i) =>
//     //         limit(() =>
//     //             chunkRankingCalculator(chunk, pageMap, pages, iterations, 0.85, i)
//     //         )
//     //     )
//     // );

//     // await chunkRankingCalculator(chunkUnscoredPages[0]!, pageMap, pages, 20, 0.85, 0)
// }

// async function chunkRankingCalculator(chunkPages: Page[], pageMap: Map<string, Page>, pages: Page[], iterations = 20, d = 0.85, i?: number, log?: ReturnType<typeof createLogger>) {

//     const safeScoring = new Map(chunkPages.map(p => [p.link, { ...p, rank: p.rank ?? 1 / pages.length }]));


//     for (let iter = 0; iter < iterations; iter++) {
//         const newRank = new Map<string, number>();
//         for (const page of chunkPages) {
//             let sum = 0;
//             for (const p of pages.filter(p => p.urls.includes(page.link))) {
//                 sum += (pageMap.get(p.link)!.rank!) / p.urls.length;
//             }
//             const tempRank = (1 - d) / pages.length + d * sum
//             newRank.set(page.link, tempRank);
//         }
//         console.log(`[${i!} - ${iter + 1}/${iterations}`)

//         // update ranks
//         chunkPages.forEach(page => safeScoring.get(page.link)!.rank = newRank.get(page.link)!)

//     }
//     // chunkPages.forEach(page => pageMap.get(page.link)!.rank = safeScoring.get(page.link)?.rank!)

//     await WebSiteModel.bulkWrite(chunkPages.map(p => ({
//         updateOne: {
//             filter: { link: p.link },
//             update: { $set: { rank: safeScoring.get(p.link)!.rank! } },
//             upsert: false
//         }
//     })))
//     console.log(`${i!} - Done !`)

// }


import { WebSiteModel } from "../../shared/models/websites.js";
import { chunkArray } from "./chunkArray.js";
import fs from "fs";

type Page = { rank?: number | null, urls: string[], link: string }

const CHECKPOINT_FILE = "./pagerank_checkpoint.json";

export async function globalWebSiteRanking(iterations: number, d: number = 0.85) {

    const pages = await WebSiteModel.find({}, { _id: 0, rank: 1, link: 1, urls: 1 });

    console.log(`Loaded ${pages.length} pages`);

    // 🧠 Initialisation
    let pageMap = new Map<string, Page>(
        pages.map(p => [p.link, { link: p.link, urls: p.urls, rank: p.rank ?? 1 / pages.length }])
    );


    // 🔥 Build incoming links map (IMPORTANT)
    const incomingMap = new Map<string, string[]>();

    for (const page of pages) {
        for (const url of page.urls) {
            if (!pageMap.has(url)) continue;
            if (!incomingMap.has(url)) incomingMap.set(url, []);
            incomingMap.get(url)!.push(page.link);
        }
    }

    console.log("Incoming map built");

    // 🔁 Reprise si checkpoint existe
    let startIter = 0;

    if (fs.existsSync(CHECKPOINT_FILE)) {
        const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8"));
        startIter = data.iteration;

        console.log(`Resuming from iteration ${startIter}`);

        for (const [link, rank] of Object.entries(data.ranks)) {
            if (pageMap.has(link)) {
                pageMap.get(link)!.rank = rank as number;
            }
        }
    }

    // 🔪 découpage en chunks
    const chunks = chunkArray(pages, 50);

    for (let iter = startIter; iter < iterations; iter++) {

        console.log(`\n=== ITERATION ${iter + 1}/${iterations} ===`);

        const newRank = new Map<string, number>();

        // 🚀 parallélisation correcte
        await Promise.all(
            chunks.map(chunk =>
                computeChunk(chunk, pageMap, incomingMap, newRank, d, pages.length)
            )
        );

        // 🔄 sync global (IMPORTANT)
        for (const [link, rank] of newRank.entries()) {
            pageMap.get(link)!.rank = rank;
        }

        // 💾 checkpoint
        saveCheckpoint(iter + 1, pageMap);

        console.log(`Iteration ${iter + 1} done`);
    }

    // 💾 sauvegarde finale en DB
    await WebSiteModel.bulkWrite(
        pages.map(p => ({
            updateOne: {
                filter: { link: p.link },
                update: { $set: { rank: pageMap.get(p.link)!.rank! } },
                upsert: false
            }
        }))
    );

    console.log("Ranking completed !");
}

async function computeChunk(
    chunk: Page[],
    pageMap: Map<string, Page>,
    incomingMap: Map<string, string[]>,
    newRank: Map<string, number>,
    d: number,
    totalPages: number
) {

    for (const page of chunk) {

        let sum = 0;

        const incomingLinks = incomingMap.get(page.link) || [];

        for (const incoming of incomingLinks) {
            const p = pageMap.get(incoming)!;
            if (p.urls.length > 0) {
                sum += p.rank! / p.urls.length;
            }
        }

        const rank = (1 - d) / totalPages + d * sum;

        newRank.set(page.link, rank);
    }
}

function saveCheckpoint(iteration: number, pageMap: Map<string, Page>) {

    const ranks: Record<string, number> = {};

    for (const [link, page] of pageMap.entries()) {
        ranks[link] = page.rank!;
    }

    fs.writeFileSync(
        CHECKPOINT_FILE,
        JSON.stringify({ iteration, ranks }),
        "utf-8"
    );
}