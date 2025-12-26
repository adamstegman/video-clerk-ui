import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  layout("layouts/main-layout.tsx", [
    ...prefix("list", [
      index("list/index.tsx"),
      route("add", "list/add.tsx"),
    ]),
    route("watch", "watch/index.tsx"),
  ]),
] satisfies RouteConfig;
