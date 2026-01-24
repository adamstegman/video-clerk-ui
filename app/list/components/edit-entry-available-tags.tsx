import { cn, secondaryTextClasses } from "../../lib/utils";
import type { EditEntryTag } from "../edit-entry-page";

interface EditEntryAvailableTagsProps {
  availableTags: EditEntryTag[];
  selectedTags: EditEntryTag[];
  onToggleTag: (tag: EditEntryTag) => void;
}

export function EditEntryAvailableTags({
  availableTags,
  selectedTags,
  onToggleTag,
}: EditEntryAvailableTagsProps) {
  return (
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
  );
}
