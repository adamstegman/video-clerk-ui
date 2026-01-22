import { secondaryTextClasses } from "../../lib/utils";

export function WatchLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-500"></div>
        <p className={secondaryTextClasses}>Loading...</p>
      </div>
    </div>
  );
}
