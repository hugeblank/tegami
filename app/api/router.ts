import { hero } from "~/api/hero";
import { router } from "~/api/trpc";
import { tegami } from "./tegami";

export const appRouter = router({
  hero,
  tegami,
});

export type AppRouter = typeof appRouter;
