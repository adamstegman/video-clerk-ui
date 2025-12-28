import { Link } from "react-router";
import { sectionSpacingClasses, secondaryTextClasses, cn } from "../lib/utils";

export function SettingsPage() {
  return (
    <>
      <div className={sectionSpacingClasses}>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          Log Out
        </Link>
      </div>
      <div className={sectionSpacingClasses}>
        <p className={cn("text-sm", secondaryTextClasses)}>
          This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
        </p>
      </div>
    </>
  );
}
