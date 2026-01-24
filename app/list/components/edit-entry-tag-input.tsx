import { ActionButton } from "../../components/action-button";
import type { EditEntryTag } from "../edit-entry-page";

interface EditEntryTagInputProps {
  tagQuery: string;
  onTagQueryChange: (value: string) => void;
  onCreateTag: (value: string) => void;
  creatingTag: boolean;
  suggestions: EditEntryTag[];
  canCreateTag: boolean;
}

export function EditEntryTagInput({
  tagQuery,
  onTagQueryChange,
  onCreateTag,
  creatingTag,
  suggestions,
  canCreateTag,
}: EditEntryTagInputProps) {
  return (
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
    </div>
  );
}
