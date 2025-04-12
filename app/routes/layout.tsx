import { Link, Outlet } from "react-router";
import type { Route } from "./+types/layout";
import { isAuthed } from "~/api/login";
import { headerHeight } from "~/util/clientonly";

export function loader({ request }: Route.LoaderArgs) {
  return isAuthed(request);
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className={`container mx-auto pt-2 h-${headerHeight}`}>
        <div className="flex flex-row justify-between">
          <Link className="align-center inline-flex" to="/">
            <img className="w-16" src="/icon.png" alt="icon"></img>
            <h1 className="block text-3xl font-semibold [writing-mode:vertical-lr]">
              手紙
            </h1>
          </Link>
          {loaderData && (
            <Link to="/admin">
              <h1 className="block text-3xl font-semibold text-red-300">
                Admin
              </h1>
            </Link>
          )}
        </div>
      </header>
      <Outlet />
    </>
  );
}
