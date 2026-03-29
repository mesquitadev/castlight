// Online lyrics search via Genius (search API + page scraping for full lyrics)

export interface OnlineSearchResult {
  title: string;
  artist: string;
  lyricsUrl: string;
  thumbnail: string;
  source: string;
}

export class LyricsSearchService {
  async search(query: string): Promise<OnlineSearchResult[]> {
    try {
      const url = `https://genius.com/api/search/multi?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const sections = data.response?.sections ?? [];
      const seen = new Set<string>();
      const results: OnlineSearchResult[] = [];

      for (const section of sections) {
        for (const hit of section.hits ?? []) {
          if (hit.type !== "song") continue;
          const song = hit.result;
          const key = `${song.title?.toLowerCase()}|${song.primary_artist?.name?.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);

          results.push({
            title: song.title ?? "",
            artist: song.primary_artist?.name ?? "",
            lyricsUrl: song.url ?? "",
            thumbnail: song.song_art_image_thumbnail_url ?? "",
            source: "genius",
          });
        }
      }

      return results.slice(0, 15);
    } catch {
      return [];
    }
  }

  async getLyrics(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const html = await response.text();

      // Extract lyrics from data-lyrics-container divs
      const containerRegex = /data-lyrics-container="true"[^>]*>(.*?)<\/div>/gs;
      const containers: string[] = [];
      let match;
      while ((match = containerRegex.exec(html)) !== null) {
        containers.push(match[1]);
      }

      if (containers.length === 0) return null;

      let text = containers.join("\n");
      // Convert <br> to newlines
      text = text.replace(/<br\s*\/?>/gi, "\n");
      // Remove all other HTML tags
      text = text.replace(/<[^>]+>/g, "");
      // Decode HTML entities
      text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
      // Clean up: remove "X ContributorsSong Title Lyrics" prefix
      text = text.replace(/^\d+\s*Contributors?.*?Lyrics\s*/i, "");
      // Remove [Section] markers but keep them as section separators
      text = text.replace(/\[([^\]]+)\]/g, "\n\n[$1]\n");
      // Trim extra whitespace
      text = text.replace(/\n{3,}/g, "\n\n").trim();

      return text;
    } catch {
      return null;
    }
  }
}
