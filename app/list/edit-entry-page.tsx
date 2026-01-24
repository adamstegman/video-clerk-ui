import { ActionButton } from "../components/action-button";
import { SettingsSection } from "../components/settings-section";
import { SettingsSubsection } from "../components/settings-subsection";
import {
  cn,
  errorTextClasses,
  pageTitleClasses,
  secondaryTextClasses,
  sectionSpacingClasses,
} from "../lib/utils";
import { EditEntryHeader } from "./components/edit-entry-header";
import { EditEntryWatchedStatus } from "./components/edit-entry-watched-status";
import { EditEntrySelectedTags } from "./components/edit-entry-selected-tags";
import { EditEntryTagInput } from "./components/edit-entry-tag-input";
import { EditEntryTagSuggestions } from "./components/edit-entry-tag-suggestions";
import { EditEntryAvailableTags } from "./components/edit-entry-available-tags";
import { EditEntryDeleteSection } from "./components/edit-entry-delete-section";

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
  watched,
  onWatchedChange,
  onTagQueryChange,
  onAddTag,
  onRemoveTag,
  onToggleTag,
  onCreateTag,
  onSaveTags,
  saving,
  saveError,
  saveCompleted,
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
  watched: boolean;
  onWatchedChange: (value: boolean) => void;
  onTagQueryChange: (value: string) => void;
  onAddTag: (tag: EditEntryTag) => void;
  onRemoveTag: (tag: EditEntryTag) => void;
  onToggleTag: (tag: EditEntryTag) => void;
  onCreateTag: (value: string) => void;
  onSaveTags: () => void;
  saving: boolean;
  saveError: string | null;
  saveCompleted: boolean;
  creatingTag: boolean;
  deleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
}) {
  return (
    <>
      <div className={sectionSpacingClasses}>
        <div className="flex items-center justify-between gap-4">
          <h2 className={pageTitleClasses}>Edit entry</h2>
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
              <EditEntryHeader entry={entry} />
            </div>
            <SettingsSection title="Status">
              <EditEntryWatchedStatus watched={watched} onWatchedChange={onWatchedChange} />
            </SettingsSection>
            <SettingsSection title="Tags">
              <SettingsSubsection
                description=""
                error={saveError}
              >
                <EditEntrySelectedTags selectedTags={selectedTags} onRemoveTag={onRemoveTag} />
                <EditEntryTagInput
                  tagQuery={tagQuery}
                  onTagQueryChange={onTagQueryChange}
                  onCreateTag={onCreateTag}
                  creatingTag={creatingTag}
                  suggestions={suggestions}
                  canCreateTag={canCreateTag}
                />
                <EditEntryTagSuggestions
                  suggestions={suggestions}
                  canCreateTag={canCreateTag}
                  tagQuery={tagQuery}
                  onCreateTag={onCreateTag}
                  onAddTag={onAddTag}
                />
                <EditEntryAvailableTags
                  availableTags={availableTags}
                  selectedTags={selectedTags}
                  onToggleTag={onToggleTag}
                />
              </SettingsSubsection>
            </SettingsSection>
            <div
              className={cn(
                sectionSpacingClasses,
                "flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
              )}
            >
              <EditEntryDeleteSection
                deleting={deleting}
                deleteError={deleteError}
                onDelete={onDelete}
              />
              <ActionButton
                onClick={onSaveTags}
                loading={saving}
                disabled={!entry || creatingTag}
                loadingText="Saving..."
                completed={saveCompleted}
                completedText="Saved!"
                className="w-full md:w-auto md:ml-auto"
              >
                Save
              </ActionButton>
            </div>
          </>
        )}
      </div>
    </>
  );
}
