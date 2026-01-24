import { cn, secondaryTextClasses } from "../../lib/utils";
import type { EditEntryTag } from "../edit-entry-page";
import { EditEntryTagButton } from "./edit-entry-tag-button";

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
              <EditEntryTagButton
                key={tag.id}
                tag={tag}
                variant="toggle"
                selected={selected}
                onClick={onToggleTag}
                ariaLabel={`${selected ? "Deselect" : "Select"} tag ${tag.name}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
