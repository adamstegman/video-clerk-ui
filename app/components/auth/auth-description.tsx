import { cn, secondaryTextClasses } from "~/lib/utils";

interface AuthDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthDescription({ children, className }: AuthDescriptionProps) {
  return (
    <p className={cn("text-sm md:text-base mb-6", secondaryTextClasses, className)}>
      {children}
    </p>
  );
}
