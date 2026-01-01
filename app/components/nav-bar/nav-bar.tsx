import { List, Settings, Play } from 'lucide-react';
import { NavItem } from './nav-item';

export function NavBar() {
  return (
    <nav className="flex items-center justify-around border-t border-zinc-200 bg-zinc-50 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-zinc-700 dark:bg-zinc-800">
      <NavItem to="/app/watch" text="Watch">
        <Play />
      </NavItem>
      <NavItem to="/app/list" text="List">
        <List />
      </NavItem>
      <NavItem to="/app/settings" text="Settings">
        <Settings />
      </NavItem>
    </nav>
  );
}
