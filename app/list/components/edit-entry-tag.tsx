import type { EditEntryTag as EditEntryTagType } from "../edit-entry-page";
import { EditEntryTagButton } from "./edit-entry-tag-button";

interface EditEntryTagProps {
  tag: EditEntryTagType;
  onRemove: (tag: EditEntryTagType) => void;
}

export function EditEntryTag({ tag, onRemove }: EditEntryTagProps) {
  return (
    <EditEntryTagButton
      tag={tag}
      variant="removable"
      selected={true}
      onClick={onRemove}
      ariaLabel={`Remove tag ${tag.name}`}
    />
  );
}
