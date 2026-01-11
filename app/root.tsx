import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect } from "react";

import type { Route } from "./+types/root";
import "./app.css";

function withBasePath(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");
  return `${normalizedBase}${normalizedPath}`;
}

export const links: Route.LinksFunction = () => [
  { rel: "manifest", href: withBasePath("manifest.webmanifest") },
  { rel: "apple-touch-icon", href: withBasePath("tv-minimal-play.light.png") },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: withBasePath("tv-minimal-play.light.svg"),
    media: "(prefers-color-scheme: light)",
  },
  {
    rel: "icon",
    type: "image/svg+xml",
    href: withBasePath("tv-minimal-play.dark.svg"),
    media: "(prefers-color-scheme: dark)",
  },
  {
    rel: "icon",
    type: "image/png",
    href: withBasePath("tv-minimal-play.light.png"),
    media: "(prefers-color-scheme: light)",
  },
  {
    rel: "icon",
    type: "image/png",
    href: withBasePath("tv-minimal-play.dark.png"),
    media: "(prefers-color-scheme: dark)",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="application-name" content="Video Clerk" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Video Clerk" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6366f1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Support GitHub Pages SPA routing for both production (/) and staging previews (/staging/pr-<n>/).
  // The root `public/404.html` stores the original URL and redirects to the base path.
  // On app load, we restore the intended URL if it belongs to this build's base.
  // This enables refresh/deep-links inside staging previews.
  useEffect(() => {
    const key = "__video_clerk_redirect__";
    try {
      const stored = window.sessionStorage.getItem(key);
      if (!stored) return;

      const base = import.meta.env.BASE_URL || "/";
      const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
      const normalizedStored = stored.startsWith("/") ? stored : `/${stored}`;

      const isStagingPreviewPath = /^\/staging\/pr-\d+(?=\/|$)/.test(normalizedStored);
      const matchesThisBuild =
        normalizedBase === ""
          ? !isStagingPreviewPath
          : normalizedStored === normalizedBase || normalizedStored.startsWith(`${normalizedBase}/`);

      if (!matchesThisBuild) return;

      window.sessionStorage.removeItem(key);
      window.history.replaceState(null, "", normalizedStored);
    } catch {
      // ignore
    }
  }, []);
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
