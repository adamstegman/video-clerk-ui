import type { ReactNode } from "react";
import { Link } from "react-router";
import { TvMinimalPlay } from "lucide-react";

export interface HeaderAction {
  to: string;
  icon: ReactNode;
}

interface HeaderProps {
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
}

export function Header({ leftAction, rightAction }: HeaderProps) {
  return (
    <header className="bg-indigo-500 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex w-12 justify-start">
          {leftAction && (
            <Link
              to={leftAction.to}
              className="px-2 text-white hover:opacity-80 transition-opacity"
            >
              {leftAction.icon}
            </Link>
          )}
        </div>
        <h1 className="text-lg font-bold flex-1 text-center flex items-center justify-center gap-2">
          <TvMinimalPlay className="h-5 w-5 text-white" />
          Video Clerk
        </h1>
        <div className="flex w-12 justify-end">
          {rightAction && (
            <Link
              to={rightAction.to}
              className="px-2 text-white hover:opacity-80 transition-opacity"
            >
              {rightAction.icon}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
