import { type RouteConfig, route, index, layout } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  layout("layouts/main-layout.tsx", [
    route("list", "routes/list.tsx"),
    route("watch", "routes/watch.tsx"),
  ]),
] satisfies RouteConfig;
