import { cn, secondaryTextClasses } from "../../lib/utils";
import type { EditEntryTag } from "../edit-entry-page";

interface EditEntrySelectedTagsProps {
  selectedTags: EditEntryTag[];
  onRemoveTag: (tag: EditEntryTag) => void;
}

export function EditEntrySelectedTags({
  selectedTags,
  onRemoveTag,
}: EditEntrySelectedTagsProps) {
  return (
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
  );
}
