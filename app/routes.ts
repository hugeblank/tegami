import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("/about", "routes/about.tsx"),
    route("/admin", "routes/admin/root.tsx"),
    route("/admin/:letter", "routes/admin/editor.tsx"),
    route("/media/:letter/:file", "routes/media/root.ts"),
    route("/open/:letter", "routes/open/root.tsx"),
    route("/login", "routes/admin/login/root.tsx"),
  ]),
  route("/api/trpc/*", "routes/trpc.ts"),
] satisfies RouteConfig;
