import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Common Tailwind class constants for consistent styling
export const pageTitleClasses = "text-2xl font-bold text-indigo-600 dark:text-indigo-400"
export const sectionSpacingClasses = "flex-shrink-0 pb-2 pt-4"
export const secondaryTextClasses = "text-zinc-600 dark:text-zinc-400"
export const primaryHeadingClasses = "text-zinc-900 dark:text-zinc-100"
export const errorTextClasses = "text-fuchsia-600 dark:text-fuchsia-400"
export const successTextClasses = "text-indigo-600 dark:text-indigo-400"