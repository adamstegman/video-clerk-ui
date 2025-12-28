import type { ReactNode } from 'react';
import { primaryHeadingClasses, secondaryTextClasses, cn } from '../lib/utils';

interface FeatureCardProps {
  icon: ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  title: string;
  description: string;
}

export function FeatureCard({
  icon,
  iconBgColor,
  iconTextColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 md:p-8 shadow-md border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-shadow">
      <div
        className={`w-12 h-12 md:w-16 md:h-16 rounded-lg ${iconBgColor} flex items-center justify-center mb-4 md:mb-6 mx-auto`}
      >
        <div className={iconTextColor}>{icon}</div>
      </div>
      <h2 className={cn("text-xl md:text-2xl font-semibold mb-3 md:mb-4", primaryHeadingClasses)}>
        {title}
      </h2>
      <p className={cn("text-sm md:text-base", secondaryTextClasses, "dark:text-zinc-300")}>
        {description}
      </p>
    </div>
  );
}
