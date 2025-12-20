import { ListIcon } from './list-icon';
import { NavItem } from './nav-item';
import { WatchIcon } from './watch-icon';

export function NavBar() {
  return (
    <nav className="flex items-center justify-around border-t border-gray-200 bg-gray-50 py-3 dark:border-gray-700 dark:bg-gray-800">
      <NavItem to="/watch" text="Watch">
        <WatchIcon />
      </NavItem>
      <NavItem to="/list" text="List">
        <ListIcon />
      </NavItem>
    </nav>
  );
}
