interface EditEntryWatchedStatusProps {
  watched: boolean;
  onWatchedChange: (value: boolean) => void;
}

export function EditEntryWatchedStatus({
  watched,
  onWatchedChange,
}: EditEntryWatchedStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        id="entry-watched"
        type="checkbox"
        checked={watched}
        onChange={(event) => onWatchedChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
      />
      <label
        htmlFor="entry-watched"
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Watched
      </label>
    </div>
  );
}
