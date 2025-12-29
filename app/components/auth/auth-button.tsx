import { cn } from "~/lib/utils";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export function AuthButton({
  children,
  variant = "primary",
  fullWidth = false,
  className,
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <button
      className={cn(
        "px-6 py-3 rounded-md font-semibold text-base transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        fullWidth && "w-full",
        variant === "primary" && [
          "bg-indigo-500 hover:bg-indigo-600 text-white",
          "focus:ring-indigo-500",
          "disabled:bg-indigo-300 disabled:cursor-not-allowed",
        ],
        variant === "secondary" && [
          "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600",
          "text-zinc-900 dark:text-zinc-100",
          "focus:ring-zinc-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        ],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
