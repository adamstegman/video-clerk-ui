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
  tags: EditEntryTag[];
}

export function EditEntryPage({
  entry,
  loading,
  error,
  tagsInput,
  onTagsChange,
  onSaveTags,
  saving,
  saveError,
  saveSuccess,
  deleting,
  deleteError,
  onDelete,
}: {
  entry: EditEntryData | null;
  loading: boolean;
  error: string | null;
  tagsInput: string;
  onTagsChange: (value: string) => void;
  onSaveTags: () => void;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
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
            <SettingsSection title="Entry">
              <div className="flex gap-4 md:gap-6 items-start">
                {entry.posterPath && config.images.secure_base_url && (
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
                  {entry.tags.length > 0 && (
                    <p className={cn("text-sm md:text-base", secondaryTextClasses)}>
                      {entry.tags.map((tag) => tag.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </SettingsSection>
            <SettingsSection title="Tags">
              <SettingsSubsection
                description="Separate tags with commas to add or remove labels for this entry."
                error={saveError}
                success={saveSuccess ? "Tags updated." : null}
              >
                <label
                  htmlFor="entry-tags"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Tags
                </label>
                <textarea
                  id="entry-tags"
                  rows={3}
                  value={tagsInput}
                  onChange={(event) => onTagsChange(event.target.value)}
                  placeholder="e.g. Cozy, Weekend, Action"
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <ActionButton
                  onClick={onSaveTags}
                  loading={saving}
                  disabled={!entry}
                  loadingText="Saving..."
                >
                  Save tags
                </ActionButton>
              </SettingsSubsection>
            </SettingsSection>
            <SettingsSection title="Delete entry">
              <SettingsSubsection
                description="Remove this entry from your list. This cannot be undone."
                error={deleteError}
              >
                <ActionButton
                  onClick={onDelete}
                  loading={deleting}
                  loadingText="Deleting..."
                  variant="secondary"
                  className="border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Delete entry
                </ActionButton>
              </SettingsSubsection>
            </SettingsSection>
          </>
        )}
      </div>
    </>
  );
}
