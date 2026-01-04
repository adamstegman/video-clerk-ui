import { type ReactNode } from "react";
import { Link } from "react-router";

interface ActionLinkProps {
  to: string;
  children: ReactNode;
}

export function ActionLink({ to, children }: ActionLinkProps) {
  return (
    <Link
      to={to}
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg transition-opacity hover:opacity-90"
    >
      {children}
    </Link>
  );
}

