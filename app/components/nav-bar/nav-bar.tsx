import { ListIcon } from './list-icon';
import { NavItem } from './nav-item';
import { SettingsIcon } from './settings-icon';
import { WatchIcon } from './watch-icon';

export function NavBar() {
  return (
    <nav className="flex items-center justify-around border-t border-zinc-200 bg-zinc-50 py-3 dark:border-zinc-700 dark:bg-zinc-800">
      <NavItem to="/app/watch" text="Watch">
        <WatchIcon />
      </NavItem>
      <NavItem to="/app/list" text="List">
        <ListIcon />
      </NavItem>
      <NavItem to="/app/settings" text="Settings">
        <SettingsIcon />
      </NavItem>
    </nav>
  );
}
