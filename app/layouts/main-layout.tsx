import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Bar */}
      <header className="bg-indigo-500 px-4 py-4 text-center text-gray-100 shadow-md">
        <h1 className="text-lg font-bold">Video Clerk</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="flex items-center justify-around border-t border-gray-200 bg-gray-50 py-3 dark:border-gray-700 dark:bg-gray-800">
        {/* Watch Tab (Active) */}
        <button className="flex flex-col items-center gap-1 text-indigo-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-xs font-medium">Watch</span>
        </button>

        {/* List Tab (Inactive) */}
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-xs font-medium">List</span>
        </button>
      </nav>
    </div>
  );
}
