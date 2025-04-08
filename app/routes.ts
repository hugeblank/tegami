import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/open/:letter", "routes/letter/root.tsx", [
    route(":file", "routes/letter/media.ts"),
  ]),
  route("/api/trpc/*", "routes/trpc.ts"),
] satisfies RouteConfig;
