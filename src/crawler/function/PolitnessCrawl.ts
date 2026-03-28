import NodeCache from "node-cache";

export class PolitnessCrawl {
  static hosts = new NodeCache({ stdTTL: 5, checkperiod: 4 });

  static append(url: string) {
    this.hosts.set(url, true);
  }

  static getOldest(urls: string[]) {
    let finalUrl: string | null = null;
    let oldestTtl = Infinity;

    for (const url of urls) {
      const ttl = this.hosts.getTtl(url) ?? 0;

      if (ttl < oldestTtl) {
        oldestTtl = ttl;
        finalUrl = url;
      }
    }

    return finalUrl!;
  }
}
