import { Outlet, useMatches } from 'react-router';
import { Header, type HeaderAction } from '../header/header';
import { NavBar } from '../nav-bar/nav-bar';

export interface RouteHandle {
  leftHeaderAction?: HeaderAction;
  rightHeaderAction?: HeaderAction;
}

export default function MainLayout() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const handle = currentMatch?.handle as RouteHandle | undefined;
  const leftAction = handle?.leftHeaderAction;
  const rightAction = handle?.rightHeaderAction;

  return (
    <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <Header leftAction={leftAction} rightAction={rightAction} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
