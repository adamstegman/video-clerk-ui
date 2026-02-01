interface TMDBImagesConfig {
  base_url: string | null;
  secure_base_url: string | null;
  backdrop_sizes: string[];
  logo_sizes: string[];
  poster_sizes: string[];
  profile_sizes: string[];
  still_sizes: string[];
}

export interface TMDBConfig {
  change_keys: string[];
  images: TMDBImagesConfig;
}

export interface TMDBSearchResults {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

export interface TMDBSearchResult {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  first_air_date?: string;
  media_type: string;
  name?: string;
  origin_country?: string[];
  original_language: string;
  original_name?: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date?: string;
  title?: string;
  vote_average: number;
  vote_count: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreList {
  genres: TMDBGenre[];
}

export interface TMDBMovieDetails {
  runtime: number | null;
}

export interface TMDBTVDetails {
  episode_run_time: number[];
}

export class TMDBAPI {
  constructor(private apiToken: string) {}

  async fetchConfiguration(): Promise<TMDBConfig> {
    const response = await fetch('https://api.themoviedb.org/3/configuration', this.fetchOptions());
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async multiSearch(query: string): Promise<TMDBSearchResults> {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}`,
      this.fetchOptions(),
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async fetchMovieGenres(): Promise<TMDBGenreList> {
    const response = await fetch(
      'https://api.themoviedb.org/3/genre/movie/list',
      this.fetchOptions(),
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async fetchTVGenres(): Promise<TMDBGenreList> {
    const response = await fetch(
      'https://api.themoviedb.org/3/genre/tv/list',
      this.fetchOptions(),
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async fetchMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}`,
      this.fetchOptions(),
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async fetchTVDetails(tmdbId: number): Promise<TMDBTVDetails> {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${tmdbId}`,
      this.fetchOptions(),
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  private fetchOptions(method: string = 'GET'): RequestInit {
    return {
      method,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiToken}`,
      },
    };
  }
}
