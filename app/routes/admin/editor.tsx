import { components, transform } from "~/components/Letter";
import type { Route } from "./+types/editor";
import { isAuthed } from "~/api/login";
import { checkKey } from "~/api/key";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { Link } from "react-router";
import Prose from "~/components/Prose";
import { useEffect } from "react";
import { headerHeight } from "~/root";
import Editor, { createForm, type EditorSchema } from "~/components/Editor";

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!isAuthed(request)) throw new Response("Unauthorized", { status: 401 });
  const check = await checkKey(params.letter, request);
  if (check) {
    return check;
  }
  throw new Response("Not found", { status: 404 });
}

function error(message: string) {
  return (
    <>
      <h2 className="text-2xl text-red-500">{message}</h2>
      <Link to="/">Go back</Link>
    </>
  );
}

export default function EditorRoute({
  params,
  loaderData,
}: Route.ComponentProps) {
  const trpc = useTRPC();

  const letterExists = useQuery(trpc.tegami.exists.queryOptions(params.letter));

  const saveLetter = useMutation(trpc.tegami.save.mutationOptions());

  const openLetter = useQuery(
    trpc.tegami.open.queryOptions({ id: params.letter, key: loaderData.key }),
  );

  const form = createForm();

  useEffect(() => {
    if (openLetter.isSuccess) {
      form.setValue("text", openLetter.data);
      form.setValue("key", loaderData.key);
    }
  }, [openLetter.data, openLetter.isSuccess]);

  async function onSubmit(data: EditorSchema) {
    saveLetter.mutateAsync({
      id: params.letter,
      key: data.key,
      letter: data.text,
    });
  }

  useEffect(() => {
    if (saveLetter.isError) {
      form.setError("root", {
        message: `Failed to save letter: ${saveLetter.error}`,
      });
      form.setValue("save", "❌");
    }
  }, [saveLetter.error, saveLetter.isError]);

  useEffect(() => {
    if (saveLetter.isPending) form.setValue("save", "⏳");
    if (saveLetter.isSuccess) {
      form.clearErrors();
      form.setValue("save", "✅");
    }
  }, [saveLetter.isPending, saveLetter.isSuccess]);

  if (!params.letter.match(/[a-z0-9]{10}/)) {
    return error("Invalid Letter ID");
  } else if (letterExists.isSuccess && !letterExists.data) {
    return error("No such Letter");
  }

  if (openLetter.isLoading) {
    return (
      <main className="mx-auto flex flex-col items-center p-4 pt-8 lg:mx-16">
        <p>Loading...</p>
      </main>
    );
  } else {
    return (
      <main
        className={`xl:mx-16 h-[calc(100vh-calc(${headerHeight}rem/4)))] flex flex-col items-center p-4 pt-8`}
      >
        <div className="flex h-full w-full gap-4">
          <Prose
            articleClass="mx-20 h-full overflow-y-auto"
            urlTransform={transform(params.letter, loaderData.key)}
            components={components}
          >
            {form.watch("text")}
          </Prose>
          <Editor form={form} onSubmit={onSubmit}></Editor>
        </div>
      </main>
    );
  }
}
