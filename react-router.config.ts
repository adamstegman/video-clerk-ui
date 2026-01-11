import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  // Support deploying the app under a sub-path (e.g. PR staging previews on GitHub Pages).
  // This should match the Vite `base` setting (we already drive that from VITE_BASE_PATH).
  basename: (() => {
    const raw = process.env.VITE_BASE_PATH || "/";
    if (raw === "/") return "/";
    const withLeading = raw.startsWith("/") ? raw : `/${raw}`;
    const withTrailing = withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
    return withTrailing;
  })(),
} satisfies Config;
