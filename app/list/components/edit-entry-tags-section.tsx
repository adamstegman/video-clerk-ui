import { SettingsSection } from "../../components/settings-section";
import { SettingsSubsection } from "../../components/settings-subsection";
import { EditEntrySelectedTags } from "./edit-entry-selected-tags";
import { EditEntryTagInput } from "./edit-entry-tag-input";
import { EditEntryTagSuggestions } from "./edit-entry-tag-suggestions";
import { EditEntryAvailableTags } from "./edit-entry-available-tags";
import type { EditEntryTag } from "../edit-entry-page";

interface EditEntryTagsSectionProps {
  selectedTags: EditEntryTag[];
  availableTags: EditEntryTag[];
  tagQuery: string;
  suggestions: EditEntryTag[];
  canCreateTag: boolean;
  creatingTag: boolean;
  saveError: string | null;
  onTagQueryChange: (value: string) => void;
  onAddTag: (tag: EditEntryTag) => void;
  onRemoveTag: (tag: EditEntryTag) => void;
  onToggleTag: (tag: EditEntryTag) => void;
  onCreateTag: (value: string) => void;
}

export function EditEntryTagsSection({
  selectedTags,
  availableTags,
  tagQuery,
  suggestions,
  canCreateTag,
  creatingTag,
  saveError,
  onTagQueryChange,
  onAddTag,
  onRemoveTag,
  onToggleTag,
  onCreateTag,
}: EditEntryTagsSectionProps) {
  return (
    <SettingsSection title="Tags">
      <SettingsSubsection description="" error={saveError}>
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
  );
}
