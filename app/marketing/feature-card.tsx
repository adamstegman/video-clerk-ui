import type { ReactNode } from 'react';

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
      <h2 className="text-xl md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3 md:mb-4">
        {title}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-300 text-sm md:text-base">
        {description}
      </p>
    </div>
  );
}

