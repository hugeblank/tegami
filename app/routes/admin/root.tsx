import { Link, redirect, useNavigate } from "react-router";
import type { Route } from "./+types/root";
import { isAuthed } from "~/api/login";
import { readdir, stat } from "fs/promises";
import { env } from "~/util/env";
import { Button } from "~/components/ui/button";
import { useTRPC } from "~/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { Trash } from "lucide-react";
import { useState } from "react";
import path from "path";
import { Card } from "~/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogDescription,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "~/components/ui/dialog";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙 Admin" },
    { name: "description", content: "手紙 Admin dashboard" },
  ];
}

type Letter = {
  name: string;
  created: Date;
  modified: Date;
};

export async function loader({ request }: Route.LoaderArgs): Promise<Letter[]> {
  if (!isAuthed(request)) {
    throw redirect("/login");
  }
  const list = await readdir(env.TEGAMI);
  return await Promise.all(
    list.map(async (name) => {
      const dir = path.join(env.TEGAMI, name, "index.md");
      const stats = await stat(dir);
      return {
        name,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    }),
  );
}

export default function Root({ loaderData }: Route.ComponentProps) {
  const createLetter = useMutation(useTRPC().tegami.create.mutationOptions());
  const deleteLetter = useMutation(useTRPC().tegami.delete.mutationOptions());
  const [letters, setLetters] = useState(loaderData);
  const navigate = useNavigate();
  async function initLetter() {
    navigate("/admin/" + (await createLetter.mutateAsync()));
  }

  async function onTrash(letter: Letter) {
    setTimeout(
      () => setLetters(letters.filter((l) => l.name !== letter.name)),
      300,
    );
    await deleteLetter.mutateAsync(letter.name);
  }

  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      <Button onClick={initLetter}>Create Letter</Button>
      <h1 className="bold py-4 text-4xl">Your Letters</h1>
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(19rem,1fr)_)] gap-4">
        {letters.map((letter, i) => {
          return (
            <>
              <Card key={letter.name + i}>
                <div className="flex flex-col gap-1 px-6">
                  <div className="flex justify-between">
                    <Link
                      className="text-xl text-blue-500 hover:underline"
                      to={letter.name}
                    >
                      {letter.name}
                    </Link>
                    <Dialog>
                      <DialogTrigger>
                        <Trash className="cursor-pointer" color="#f55" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>Are you sure?</DialogHeader>
                        <DialogDescription>
                          Deleting a Tegami is a permanent action!
                        </DialogDescription>
                        <div className="flex gap-4">
                          <DialogClose>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => onTrash(letter)}
                            >
                              Delete
                            </Button>
                          </DialogClose>
                          <DialogClose>
                            <Button type="button" variant="secondary">
                              Cancel
                            </Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p>Created: {letter.created.toLocaleString()}</p>
                  <p>Modified: {letter.modified.toLocaleString()}</p>
                </div>
              </Card>
            </>
          );
        })}
      </div>
    </main>
  );
}
