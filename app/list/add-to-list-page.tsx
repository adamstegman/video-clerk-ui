import { TMDBSearchContainer } from "./tmdb-search-container";

interface AddToListPageProps {
  initialQuery?: string;
}

export function AddToListPage({ initialQuery }: AddToListPageProps) {
  return <TMDBSearchContainer initialQuery={initialQuery} />;
}

