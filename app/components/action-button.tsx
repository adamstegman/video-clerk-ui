import { cn } from '../lib/utils';

export function ActionButton({
  onClick,
  disabled,
  loading = false,
  completed = false,
  loadingText,
  completedText,
  children,
  className,
  ariaLabel,
  type = 'button',
}: {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  completed?: boolean;
  loadingText?: string;
  completedText?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const isDisabled = disabled || loading || completed;
  const displayText = completed ? completedText || children : loading ? loadingText || children : children;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center rounded px-3 py-2 text-sm font-medium transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
        completed
          ? "bg-indigo-300 text-zinc-900"
          : "bg-indigo-600 text-white hover:bg-indigo-700",
        className
      )}
      aria-label={ariaLabel}
    >
      {displayText}
    </button>
  );
}
