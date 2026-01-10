import { sectionSpacingClasses } from "~/lib/utils";

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className={sectionSpacingClasses}>
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-3 rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        {children}
      </div>
    </div>
  );
}
