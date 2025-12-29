import { cn, primaryHeadingClasses } from "~/lib/utils";

interface AuthTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthTitle({ children, className }: AuthTitleProps) {
  return (
    <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", primaryHeadingClasses, className)}>
      {children}
    </h1>
  );
}
