import type { EditEntryTag as EditEntryTagType } from "../edit-entry-page";

interface EditEntryTagProps {
  tag: EditEntryTagType;
  onRemove: (tag: EditEntryTagType) => void;
}

export function EditEntryTag({ tag, onRemove }: EditEntryTagProps) {
  return (
    <button
      type="button"
      onClick={() => onRemove(tag)}
      className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
      aria-label={`Remove tag ${tag.name}`}
    >
      {tag.name}
    </button>
  );
}
