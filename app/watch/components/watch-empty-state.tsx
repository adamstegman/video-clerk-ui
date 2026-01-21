import { ActionButton } from "../../components/action-button";
import { cn, secondaryTextClasses } from "../../lib/utils";

export function WatchEmptyState({ onReload }: { onReload: () => Promise<void> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <p className={cn("text-sm", secondaryTextClasses)}>No unwatched items to swipe on.</p>
      <ActionButton size="lg" onClick={() => void onReload()}>
        Reload
      </ActionButton>
    </div>
  );
}
