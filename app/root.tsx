import "~/app.css";
import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { Providers } from "~/components/providers";
import {
  queryClientContext,
  queryClientMiddleware,
  trpcMiddleware,
} from "~/lib/prefetch";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <header className="container mx-auto pt-2">
          <Link to="/">
            <div className="align-center flex w-16">
              <img src="/icon.png" alt="icon"></img>
              <h1 className="text-3xl font-semibold [writing-mode:vertical-lr]">
                手紙
              </h1>
            </div>
          </Link>
        </header>
        <main className="container mx-auto flex flex-col items-center p-4 pt-8">
          {children}
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export const unstable_middleware = [queryClientMiddleware, trpcMiddleware];

export function loader({ context }: Route.LoaderArgs) {
  const queryClient = context.get(queryClientContext);

  return data(dehydrate(queryClient));
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Providers>
      <HydrationBoundary state={loaderData}>
        <Outlet />
      </HydrationBoundary>
    </Providers>
  );
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
    <main className="container mx-auto p-4 pt-8">
      <h1>{message}</h1>
      <p>{details}</p>
      <Link to="/" className="text-blue-500 underline">
        Go back
      </Link>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
