import { type MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from './database.generated.types'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Override function argument types to match schema nullability
// Columns that are nullable in tmdb_details schema should have nullable function arguments
export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Functions: {
        save_tmdb_result_to_list: {
          Args: {
            // These columns are nullable in the schema, so arguments should be nullable
            p_backdrop_path: string | null
            p_poster_path: string | null
            p_overview: string | null
            p_popularity: number | null
            p_vote_average: number | null
            p_vote_count: number | null
            p_title: string | null // maps to name column
            p_original_name: string | null
            p_release_date: string | null
            p_origin_country: Json | null
            p_runtime: number | null
            // genre arrays can be null (they're optional)
            p_genre_ids: number[] | null
            p_genre_names: string[] | null
          }
        }
      }
    }
  }
>
