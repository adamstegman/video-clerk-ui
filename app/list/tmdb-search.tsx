import { useRef, useContext, useState, useEffect } from 'react';
import { Form, useNavigate, useSearchParams } from 'react-router';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { TMDBSearchResult } from './tmdb-search-result';
import tmdbLogo from '../tmdb-api/tmdb-primary-long-blue.svg';

export function TMDBSearch({
  onSearch,
  results,
  error,
  loading,
  initialQuery,
}: {
  onSearch: (term: string) => void;
  results: TMDBSearchResultItem[];
  error?: string | null;
  loading?: boolean;
  initialQuery?: string;
}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = useContext(TMDBConfigurationContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialQuery || '');

  const displayError = error || config.error;

  useEffect(() => {
    if (initialQuery !== undefined) {
      setSearchValue(initialQuery);
    }
  }, [initialQuery]);

  const updateURL = (term: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (term) {
      newSearchParams.set('q', term);
    } else {
      newSearchParams.delete('q');
    }
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  const handleDebouncedSearch = (term: string, afterDelayMs = 250) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const performSearch = () => {
      updateURL(term || '');
      onSearch(term || '');
    };

    if (afterDelayMs === 0 || !term) {
      performSearch();
    } else {
      timeoutRef.current = setTimeout(performSearch, afterDelayMs);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Hide keyboard on mobile by blurring the input
    inputRef.current?.blur();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('q') as string;
    handleDebouncedSearch(query, 0); // immediate search
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-7xl flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-4 pb-2 pt-4 md:px-8 lg:px-12 xl:px-16">
          <p className="mb-3 text-xl text-gray-700 dark:text-gray-200 md:text-2xl">Search for titles to add to your list</p>
          <Form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="search"
              name="q"
              placeholder="Type a title..."
              value={searchValue}
              className="w-full p-2 border rounded text-black dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 md:p-3 md:text-lg"
              onChange={(e) => {
                setSearchValue(e.target.value);
                handleDebouncedSearch(e.target.value);
              }}
            />
          </Form>
          {displayError && (
            <div className="mt-2 text-red-500">{displayError}</div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 md:px-8 lg:px-12 xl:px-16">
          {loading && !displayError && results.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-500"></div>
                <p className="text-gray-600 dark:text-gray-400">Searching...</p>
              </div>
            </div>
          )}
          {results.length > 0 && !displayError && (
            <div className="space-y-4 md:space-y-6">
              {results.map((result) => (
                <TMDBSearchResult key={result.id} result={result} />
              ))}
              <div className="flex items-center gap-2 py-4">
                Results by <img src={tmdbLogo} alt="TMDB" className="h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
