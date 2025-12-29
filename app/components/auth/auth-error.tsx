import { cn } from "~/lib/utils";

interface AuthErrorProps {
  message: string | null;
  className?: string;
}

export function AuthError({ message, className }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div className={cn("mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800", className)}>
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  );
}
