import { cn, secondaryTextClasses } from "../../lib/utils";
import type { EditEntryTag as EditEntryTagType } from "../edit-entry-page";
import { EditEntryTagButton } from "./edit-entry-tag-button";

interface EditEntrySelectedTagsProps {
  selectedTags: EditEntryTagType[];
  onRemoveTag: (tag: EditEntryTagType) => void;
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
        <EditEntryTagButton
          key={tag.id}
          tag={tag}
          variant="removable"
          selected={true}
          onClick={onRemoveTag}
          ariaLabel={`Remove tag ${tag.name}`}
        />
      ))}
    </div>
  );
}
