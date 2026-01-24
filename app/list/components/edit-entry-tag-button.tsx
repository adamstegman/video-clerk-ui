import { cn } from "../../lib/utils";
import type { EditEntryTag as EditEntryTagType } from "../edit-entry-page";

interface EditEntryTagButtonProps {
  tag: EditEntryTagType;
  variant: "removable" | "toggle";
  selected: boolean;
  onClick: (tag: EditEntryTagType) => void;
  ariaLabel: string;
}

export function EditEntryTagButton({
  tag,
  variant,
  selected,
  onClick,
  ariaLabel,
}: EditEntryTagButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(tag)}
      aria-label={ariaLabel}
      aria-pressed={variant === "toggle" ? selected : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        variant === "removable" &&
          "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200",
        variant === "toggle" && "transition",
        variant === "toggle" &&
          selected &&
          "border-indigo-400 bg-indigo-500 text-white hover:bg-indigo-400 dark:border-indigo-500 dark:bg-indigo-500",
        variant === "toggle" &&
          !selected &&
          "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
      )}
    >
      {tag.name}
    </button>
  );
}
