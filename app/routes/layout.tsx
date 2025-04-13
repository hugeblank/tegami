import { Link, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { isAuthed } from "~/api/login";

export function loader({ request }: Route.LoaderArgs) {
  return isAuthed(request);
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className="container mx-auto h-[calc(var(--header-height)/4)] pt-2">
        <div className="flex w-full flex-row justify-between">
          <Link className="align-center inline-flex" to="/">
            <img className="w-16" src="/static/icon.png" alt="icon"></img>
            <h1 className="block text-3xl font-semibold [writing-mode:vertical-lr]">
              手紙
            </h1>
          </Link>
          <div className="flex flex-row gap-8">
            <Link to="/about" className="align-center">
              <h1 className="block text-3xl font-semibold">About</h1>
            </Link>
            {loaderData && (
              <Link to="/admin" className="align-center">
                <h1 className="block text-3xl font-semibold text-red-300">
                  Admin
                </h1>
              </Link>
            )}
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
