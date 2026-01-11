import { cn, errorTextClasses, successTextClasses } from "~/lib/utils";

interface SettingsSubsectionProps {
  description: string;
  children: React.ReactNode;
  error?: string | null;
  success?: string | null;
  showBottomBorder?: boolean;
}

export function SettingsSubsection({
  description,
  children,
  error,
  success,
  showBottomBorder = false,
}: SettingsSubsectionProps) {
  return (
    <>
      <p className="text-sm">{description}</p>
      <div className="mt-3 flex flex-col gap-2">
        {children}
        {success && <p className={cn("text-sm", successTextClasses)}>{success}</p>}
      </div>
      {error && <p className={cn("mt-2 text-sm", errorTextClasses)}>{error}</p>}
      {showBottomBorder && <div className="border-t border-zinc-200 dark:border-zinc-700 my-4"></div>}
    </>
  );
}
