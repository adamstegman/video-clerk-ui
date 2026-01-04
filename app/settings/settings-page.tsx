import { useContext } from "react";
import { Link } from 'react-router'
import { sectionSpacingClasses, secondaryTextClasses, cn } from "~/lib/utils";
import { AppDataContext } from "../app-data/app-data-provider";

export function SettingsPage() {
  const { user } = useContext(AppDataContext);

  return (
    <>
      {user && (
        <p>
          Hello <span className="text-primary font-semibold">{user.email}</span>
        </p>
      )}
      <div className={sectionSpacingClasses}>
        <Link
          to="/logout"
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
