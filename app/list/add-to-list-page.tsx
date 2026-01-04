import { TMDBSearchContainer } from "./tmdb-search-container";

interface AddToListPageProps {
  initialQuery?: string;
  userId?: string | null;
}

export function AddToListPage({ initialQuery, userId }: AddToListPageProps) {
  return <TMDBSearchContainer initialQuery={initialQuery} userId={userId} />;
}

