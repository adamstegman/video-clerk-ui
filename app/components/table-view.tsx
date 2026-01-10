import { ActionButton } from './action-button';
import { cn } from '../lib/utils';

interface TableViewProps {
  children: React.ReactNode;
  showBottomBorder?: boolean;
}

export function TableView({ children, showBottomBorder = false }: TableViewProps) {
  return (
    <>
      {children}
      {showBottomBorder && <div className="border-t border-zinc-200 dark:border-zinc-700 my-4"></div>}
    </>
  );
}

interface TableViewRowProps {
  label: string;
  value: string;
}

export function TableViewRow({ label, value }: TableViewRowProps) {
  return (
    <div className="flex items-center justify-between my-2 first:mt-0 last:mb-0">
      <span className="text-sm font-medium flex-shrink-0">{label}</span>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{value}</span>
    </div>
  );
}

export function TableViewActionButton({
  className,
  ...props
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
  return (
    <ActionButton
      {...props}
      className={cn("w-full sm:w-auto sm:min-w-[140px] sm:self-start", className)}
    />
  );
}
