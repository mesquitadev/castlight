// Online lyrics search via Vagalume API (free, no key needed for search)
// Falls back to simple scraping if API fails

export interface OnlineSearchResult {
  title: string;
  artist: string;
  text: string;
  source: string;
}

export class LyricsSearchService {
  async search(query: string): Promise<OnlineSearchResult[]> {
    try {
      return await this.searchVagalume(query);
    } catch {
      return [];
    }
  }

  private async searchVagalume(query: string): Promise<OnlineSearchResult[]> {
    const url = `https://api.vagalume.com.br/search.php?musict=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.response?.docs) return [];

    return data.response.docs.slice(0, 10).map((doc: any) => ({
      title: doc.title ?? "",
      artist: doc.band ?? "",
      text: "",
      source: "vagalume",
    }));
  }

  async getLyrics(artist: string, title: string): Promise<string | null> {
    try {
      const url = `https://api.vagalume.com.br/search.php?art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(title)}`;
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.type === "exact" || data.type === "aprox") {
        return data.mus?.[0]?.text ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }
}
