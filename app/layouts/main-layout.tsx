import { Outlet } from 'react-router';
import { Header } from '../header/header';
import { NavBar } from '../nav-bar/nav-bar';

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
      <NavBar />
    </div>
  );
}
