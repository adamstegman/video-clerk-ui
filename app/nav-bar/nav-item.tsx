import { type ReactNode } from 'react';
import { NavLink } from 'react-router';

interface NavItemProps {
  to: string;
  text: string;
  children: ReactNode;
}

export function NavItem({ to, text, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 dark:text-gray-400 dark:hover:text-indigo-400 ${isActive ? 'text-indigo-500' : 'text-gray-500 hover:text-indigo-500'
        }`
      }
    >
      {children}
      <span className="text-xs font-medium">{text}</span>
    </NavLink>
  );
}
