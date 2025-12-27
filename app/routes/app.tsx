import {
  Outlet,
  useMatches,
} from "react-router";

import type { Route } from "./+types/app";
import { Header, type HeaderAction } from '../components/header/header';
import { NavBar } from '../components/nav-bar/nav-bar';
import { TMDBAPIProvider } from "../tmdb-api/tmdb-api-provider";
import { TMDBConfiguration } from "../tmdb-api/tmdb-configuration";
import { TMDBGenres } from "../tmdb-api/tmdb-genres";

export interface RouteHandle {
  leftHeaderAction?: HeaderAction;
  rightHeaderAction?: HeaderAction;
}

export default function App() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const handle = currentMatch?.handle as RouteHandle | undefined;
  const leftAction = handle?.leftHeaderAction;
  const rightAction = handle?.rightHeaderAction;

  return (
    <TMDBAPIProvider>
      <TMDBConfiguration>
        <TMDBGenres>
          <div className="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
            <Header leftAction={leftAction} rightAction={rightAction} />
            <main className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="mx-auto w-full max-w-5xl px-4 md:px-8 lg:px-12 xl:px-16 flex-1 flex flex-col min-h-0">
                <Outlet />
              </div>
            </main>
            <NavBar />
          </div>
        </TMDBGenres>
      </TMDBConfiguration>
    </TMDBAPIProvider>
  );
}

