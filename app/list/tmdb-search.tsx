import { useRef, useContext, useState, useEffect } from 'react';
import { Form, useNavigate, useSearchParams } from 'react-router';
import { TMDBConfigurationContext } from '../tmdb-api/tmdb-configuration';
import type { TMDBSearchResultItem } from './tmdb-search-container';
import { TMDBSearchResultContainer } from './tmdb-search-result-container';
import tmdbLogo from '../tmdb-api/tmdb-primary-long-blue.svg';
import { pageTitleClasses, sectionSpacingClasses, secondaryTextClasses, cn } from '../lib/utils';

export function TMDBSearch({
  onSearch,
  results,
  savedByMediaType,
  error,
  loading,
  initialQuery,
}: {
  onSearch: (term: string) => void;
  results: TMDBSearchResultItem[];
  savedByMediaType?: Map<string, Set<number>>;
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
    <>
      <div className={sectionSpacingClasses}>
        <p className={cn("mb-3", pageTitleClasses)}>Search for titles to add to your list</p>
        <Form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="search"
            name="q"
            placeholder="Type a title..."
            value={searchValue}
            className="w-full p-2 border rounded text-black dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600"
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
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {loading && !displayError && results.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
              <p className={secondaryTextClasses}>Searching...</p>
            </div>
          </div>
        )}
        {results.length > 0 && !displayError && (
          <div className="space-y-4 md:space-y-6">
            {results.map((result) => (
              <TMDBSearchResultContainer
                key={`${result.media_type}-${result.id}`}
                result={result}
                initiallySaved={savedByMediaType?.get(result.media_type)?.has(result.id) ?? false}
              />
            ))}
            <div className="flex items-center gap-2 py-4">
              Results by <img src={tmdbLogo} alt="TMDB" className="h-4" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
