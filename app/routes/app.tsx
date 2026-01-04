import {
  Outlet,
  redirect,
  useMatches,
} from "react-router";

import type { Route } from "./+types/app";
import { Header, type HeaderAction } from '../components/header/header';
import { NavBar } from '../components/nav-bar/nav-bar';
import { AppDataProvider, type AppData } from "../app-data/app-data-provider";
import { TMDBAPIProvider } from "../tmdb-api/tmdb-api-provider";
import { TMDBConfiguration } from "../tmdb-api/tmdb-configuration";
import { TMDBGenres } from "../tmdb-api/tmdb-genres";
import { createClient } from "~/lib/supabase/client";

export interface RouteHandle {
  leftHeaderAction?: HeaderAction;
  rightHeaderAction?: HeaderAction;
}

export async function clientLoader({ request }: { request: Request }): Promise<AppData | Response> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    // Include returnTo parameter with the current URL
    const url = new URL(request.url)
    const returnTo = url.pathname + url.search
    return redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }
  return data
}

export default function App() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const handle = currentMatch?.handle as RouteHandle | undefined;
  const leftAction = handle?.leftHeaderAction;
  const rightAction = handle?.rightHeaderAction;

  const appData: AppData =
    matches
      .map((m) => m.data)
      .find(
        (data): data is AppData =>
          !!data && typeof data === "object" && "user" in data
      ) ?? { user: null };

  return (
    <AppDataProvider data={appData}>
      <TMDBAPIProvider>
        <TMDBConfiguration>
          <TMDBGenres>
            <div className="flex h-svh flex-col bg-zinc-100 dark:bg-zinc-900">
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
    </AppDataProvider>
  );
}
