import { useContext } from "react";
import { Link } from "react-router";
import { TMDBConfigurationContext } from "../tmdb-api/tmdb-configuration";
import { ActionButton } from "../components/action-button";
import { SettingsSection } from "../components/settings-section";
import { SettingsSubsection } from "../components/settings-subsection";
import {
  cn,
  errorTextClasses,
  pageTitleClasses,
  primaryHeadingClasses,
  secondaryTextClasses,
  sectionSpacingClasses,
} from "../lib/utils";

export interface EditEntryTag {
  id: number;
  name: string;
  is_custom: boolean;
}

export interface EditEntryData {
  id: number;
  title: string;
  releaseYear: string;
  posterPath: string | null;
}

export function EditEntryPage({
  entry,
  loading,
  error,
  selectedTags,
  availableTags,
  tagQuery,
  suggestions,
  canCreateTag,
  onTagQueryChange,
  onAddTag,
  onRemoveTag,
  onToggleTag,
  onCreateTag,
  onSaveTags,
  saving,
  saveError,
  saveSuccess,
  creatingTag,
  deleting,
  deleteError,
  onDelete,
}: {
  entry: EditEntryData | null;
  loading: boolean;
  error: string | null;
  selectedTags: EditEntryTag[];
  availableTags: EditEntryTag[];
  tagQuery: string;
  suggestions: EditEntryTag[];
  canCreateTag: boolean;
  onTagQueryChange: (value: string) => void;
  onAddTag: (tag: EditEntryTag) => void;
  onRemoveTag: (tag: EditEntryTag) => void;
  onToggleTag: (tag: EditEntryTag) => void;
  onCreateTag: (value: string) => void;
  onSaveTags: () => void;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  creatingTag: boolean;
  deleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
}) {
  const config = useContext(TMDBConfigurationContext);

  const posterSizeIndex =
    config.images.poster_sizes.length > 2 ? 2 : config.images.poster_sizes.length - 1;
  const posterSize = config.images.poster_sizes[posterSizeIndex] || config.images.poster_sizes[0];

  return (
    <>
      <div className={sectionSpacingClasses}>
        <div className="flex items-center justify-between gap-4">
          <h2 className={pageTitleClasses}>Edit entry</h2>
          <Link
            to="/app/list"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Back to list
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {loading && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
              <p className={secondaryTextClasses}>Loading entry...</p>
            </div>
          </div>
        )}
        {error && <p className={cn("text-sm", errorTextClasses)}>{error}</p>}
        {!loading && !error && entry && (
          <>
            <div className={sectionSpacingClasses}>
              <div className="flex gap-4 md:gap-6 items-start">
                {entry.posterPath && config.images.secure_base_url && posterSize && (
                  <img
                    src={`${config.images.secure_base_url}${posterSize}${entry.posterPath}`}
                    alt={entry.title}
                    className="flex-shrink-0 w-16 h-24 object-cover rounded md:w-20 md:h-[120px]"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={cn("font-bold text-base md:text-lg", primaryHeadingClasses)}>
                    {entry.title}
                  </h3>
                  {entry.releaseYear && (
                    <p className={cn("text-sm md:text-base", secondaryTextClasses)}>
                      {entry.releaseYear}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <SettingsSection title="Tags">
              <SettingsSubsection
                description="Separate tags with commas to add or remove labels for this entry."
                error={saveError}
                success={saveSuccess ? "Tags updated." : null}
              >
                <div className="flex flex-wrap gap-2">
                  {selectedTags.length === 0 && (
                    <p className={cn("text-sm", secondaryTextClasses)}>No tags selected.</p>
                  )}
                  {selectedTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onRemoveTag(tag)}
                      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                      aria-label={`Remove tag ${tag.name}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="entry-tag-query"
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Add tag
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      id="entry-tag-query"
                      value={tagQuery}
                      onChange={(event) => onTagQueryChange(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === "Tab" || event.key === ",") {
                          if (tagQuery.trim().length === 0) return;
                          event.preventDefault();
                          onCreateTag(tagQuery);
                        }
                      }}
                      placeholder="Type a tag name"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      aria-autocomplete="list"
                      aria-expanded={suggestions.length > 0 || canCreateTag}
                      aria-controls="entry-tag-suggestions"
                    />
                    <ActionButton
                      onClick={() => onCreateTag(tagQuery)}
                      disabled={tagQuery.trim().length === 0 || creatingTag}
                      loading={creatingTag}
                      loadingText="Adding..."
                      variant="secondary"
                      size="sm"
                      className="sm:w-auto"
                    >
                      Add
                    </ActionButton>
                  </div>
                  {(suggestions.length > 0 || canCreateTag) && (
                    <div
                      id="entry-tag-suggestions"
                      role="listbox"
                      className="rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {canCreateTag && (
                        <button
                          type="button"
                          onClick={() => onCreateTag(tagQuery)}
                          className="w-full rounded-md px-2 py-1 text-left text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                        >
                          Create "{tagQuery.trim()}"
                        </button>
                      )}
                      {suggestions.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => onAddTag(tag)}
                          className="w-full rounded-md px-2 py-1 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Existing tags
                  </p>
                  {availableTags.length === 0 ? (
                    <p className={cn("text-sm", secondaryTextClasses)}>No tags available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => {
                        const selected = selectedTags.some((selectedTag) => selectedTag.id === tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => onToggleTag(tag)}
                            aria-pressed={selected}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition",
                              selected
                                ? "border-indigo-400 bg-indigo-500 text-white hover:bg-indigo-400 dark:border-indigo-500 dark:bg-indigo-500"
                                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            )}
                          >
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SettingsSubsection>
            </SettingsSection>
            <div className={sectionSpacingClasses}>
              <ActionButton
                onClick={onSaveTags}
                loading={saving}
                disabled={!entry || creatingTag}
                loadingText="Saving..."
                className="w-full sm:w-auto"
              >
                Save
              </ActionButton>
            </div>
            <div className={sectionSpacingClasses}>
              <div className="flex flex-col gap-2">
                <ActionButton
                  onClick={onDelete}
                  loading={deleting}
                  loadingText="Deleting..."
                  variant="secondary"
                  className="border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete entry
                </ActionButton>
                {deleteError && <p className={cn("text-sm", errorTextClasses)}>{deleteError}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
