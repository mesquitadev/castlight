// Online music search via Deezer API (free, no key needed)

export interface OnlineSearchResult {
  title: string;
  artist: string;
  albumCover: string;
  duration: number;
  source: string;
}

export class LyricsSearchService {
  async search(query: string): Promise<OnlineSearchResult[]> {
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      if (!data.data) return [];

      // Deduplicate by title+artist
      const seen = new Set<string>();
      const results: OnlineSearchResult[] = [];

      for (const track of data.data) {
        const key = `${track.title_short?.toLowerCase()}|${track.artist?.name?.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          title: track.title_short ?? track.title ?? "",
          artist: track.artist?.name ?? "",
          albumCover: track.album?.cover_small ?? "",
          duration: track.duration ?? 0,
          source: "deezer",
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}
