import { cn } from '../lib/utils';

type ActionButtonVariant = 'primary' | 'secondary';
type ActionButtonSize = 'sm' | 'md' | 'lg';

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
  variant = 'primary',
  size = 'md',
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
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
}) {
  const isDisabled = disabled || loading || completed;
  const displayText = completed ? completedText || children : loading ? loadingText || children : children;
  const sizeClasses: Record<ActionButtonSize, string> = {
    sm: 'rounded px-2.5 py-1.5 text-xs font-medium',
    md: 'rounded px-3 py-2 text-sm font-medium',
    lg: 'rounded-xl px-4 py-3 text-sm font-semibold',
  };
  const variantClasses: Record<ActionButtonVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary:
      'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900',
  };
  const stateClasses = completed ? 'bg-indigo-300 text-zinc-900' : variantClasses[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-70',
        sizeClasses[size],
        stateClasses,
        className
      )}
      aria-label={ariaLabel}
    >
      {displayText}
    </button>
  );
}
