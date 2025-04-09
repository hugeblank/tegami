import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/login", "routes/admin/login.ts"),
  route("/admin", "routes/admin/root.tsx"),
  route("/admin/:letter", "routes/admin/editor.tsx"),
  route("/media/:letter/:file", "routes/media/root.ts"),
  route("/open/:letter", "routes/letter/root.tsx"),
  route("/api/trpc/*", "routes/trpc.ts"),
] satisfies RouteConfig;
