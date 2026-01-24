import type { EditEntryTag } from "../edit-entry-page";

interface EditEntryTagSuggestionsProps {
  suggestions: EditEntryTag[];
  canCreateTag: boolean;
  tagQuery: string;
  onCreateTag: (value: string) => void;
  onAddTag: (tag: EditEntryTag) => void;
}

export function EditEntryTagSuggestions({
  suggestions,
  canCreateTag,
  tagQuery,
  onCreateTag,
  onAddTag,
}: EditEntryTagSuggestionsProps) {
  if (suggestions.length === 0 && !canCreateTag) {
    return null;
  }

  return (
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
  );
}
