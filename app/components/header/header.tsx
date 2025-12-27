import type { ReactNode } from "react";
import { Link } from "react-router";

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
    <header className="bg-indigo-500 px-4 py-4 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex w-12 justify-start">
          {leftAction && (
            <Link
              to={leftAction.to}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {leftAction.icon}
            </Link>
          )}
        </div>
        <h1 className="text-lg font-bold flex-1 text-center">Video Clerk</h1>
        <div className="flex w-12 justify-end">
          {rightAction && (
            <Link
              to={rightAction.to}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {rightAction.icon}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
