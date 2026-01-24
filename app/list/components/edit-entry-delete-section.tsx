import { ActionButton } from "../../components/action-button";
import { cn, errorTextClasses } from "../../lib/utils";

interface EditEntryDeleteSectionProps {
  deleting: boolean;
  deleteError: string | null;
  onDelete: () => void;
}

export function EditEntryDeleteSection({
  deleting,
  deleteError,
  onDelete,
}: EditEntryDeleteSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <ActionButton
        onClick={onDelete}
        loading={deleting}
        loadingText="Deleting..."
        variant="secondary"
        className="border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 w-full md:w-auto"
      >
        Delete entry
      </ActionButton>
      {deleteError && <p className={cn("text-sm", errorTextClasses)}>{deleteError}</p>}
    </div>
  );
}
