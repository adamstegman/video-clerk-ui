import { cn } from "~/lib/utils";
import { AuthLogo } from "./auth-logo";

interface AuthFormProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthForm({ children, className }: AuthFormProps) {
  return (
    <div className={cn("relative flex min-h-svh w-full items-center justify-center p-6 md:p-10", className)}>
      <AuthLogo />
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
