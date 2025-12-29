import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface AuthLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthLink({ to, children, className }: AuthLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300",
        "underline underline-offset-4 transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
}
