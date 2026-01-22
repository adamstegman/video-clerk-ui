import { cn, pageTitleClasses, secondaryTextClasses } from "../../lib/utils";

export function WatchHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex-shrink-0 pb-2 pt-4">
      <h2 className={pageTitleClasses}>Watch</h2>
      <p className={cn("mt-1 text-sm", secondaryTextClasses)}>{subtitle}</p>
    </div>
  );
}
