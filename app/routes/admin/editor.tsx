import { components, transform } from "~/components/Letter";
import type { Route } from "./+types/editor";
import { isAuthed } from "~/api/login";
import { checkKey } from "~/util/key";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { Link, redirect, type ActionFunctionArgs } from "react-router";
import Prose from "~/components/Prose";
import { useEffect, useState } from "react";
import { headerHeight } from "~/root";
import Editor, { useEditorForm, type EditorSchema } from "~/components/Editor";
import { useWatch } from "react-hook-form";
import { writeFile } from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { env } from "~/util/env";
import { findPath } from "~/util/naming";

export async function action({ request, params }: ActionFunctionArgs) {
  if (!isAuthed(request)) throw new Response("Unauthorized", { status: 400 });
  const formData = await request.formData();
  const entry = formData.get("media") as File | null;
  if (entry) {
    const buf = await entry.arrayBuffer();
    const type = await fileTypeFromBuffer(buf);
    const ext = "." + (type ? type.ext : "bin");
    const [partialPath] = findPath(
      path.join(env.TEGAMI, params["letter"]!),
      ext,
    );
    await writeFile(partialPath, Buffer.from(buf));
  }
}

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!isAuthed(request)) throw redirect("/login");
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

  const form = useEditorForm();
  const text = useWatch<EditorSchema>({ control: form.control, name: "text" });
  const key = useWatch<EditorSchema>({ control: form.control, name: "key" });

  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>();

  useEffect(() => {
    if (timer) clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        if (text)
          saveLetter.mutateAsync({
            id: params.letter,
            key: key.length > 0 ? key : undefined,
            letter: text,
          });
      }, 1000),
    );
  }, [text, key, params.letter, saveLetter.mutateAsync, timer]);

  useEffect(() => {
    if (openLetter.isSuccess) {
      form.setValue("text", openLetter.data);
      form.setValue("key", loaderData.key ?? "");
    }
  }, [openLetter.data, openLetter.isSuccess, form, loaderData.key]);

  useEffect(() => {
    if (saveLetter.isError) {
      form.setError("root", {
        message: `Failed to save letter: ${saveLetter.error}`,
      });
      form.setValue("save", "❌");
    }
  }, [saveLetter.error, saveLetter.isError, form]);

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
        className={`xl:mx-16 h-[calc(100vh_-_(${headerHeight}rem_/_4))] flex flex-col items-center p-4 pt-8`}
      >
        <div className="flex h-full w-full gap-4">
          <Prose
            articleClass="mx-20 w-1/2 h-full overflow-y-auto"
            urlTransform={transform(params.letter, loaderData.key)}
            components={components}
          >
            {text}
          </Prose>
          <Editor
            id={params.letter}
            accessKey={key.length > 0 ? key : undefined}
            form={form}
          ></Editor>
        </div>
      </main>
    );
  }
}
