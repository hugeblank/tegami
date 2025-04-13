import { components, transform } from "~/components/Letter";
import type { Route } from "./+types/editor";
import { isAuthed } from "~/api/login";
import { checkKey } from "~/util/misc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAsyncDebouncer } from "@tanstack/react-pacer";
import { useTRPC } from "~/lib/trpc";
import { redirect, type ActionFunctionArgs } from "react-router";
import Prose from "~/components/Prose";
import { useEffect } from "react";
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
  // checkKey implicitly checks if letter exists
  if (check) {
    return check;
  }
  throw new Response("Not found", { status: 404 });
}

export default function EditorRoute({
  params,
  loaderData,
}: Route.ComponentProps) {
  const { save, open } = useTRPC().tegami;
  const {
    isError: saveLetterErrored,
    isPending: saveLetterPending,
    isSuccess: saveLetterSuccess,
    mutateAsync: saveLetterAsync,
    error: saveLetterError,
  } = useMutation(save.mutationOptions());
  const {
    isSuccess: isOpenLetterSuccess,
    data: letterData,
    isLoading: openLetterLoading,
  } = useQuery(open.queryOptions({ id: params.letter, key: loaderData.key }));

  const form = useEditorForm();
  const { setValue, setError, clearErrors, control } = form;
  const text = useWatch<EditorSchema>({ control, name: "text" });
  const key = useWatch<EditorSchema>({ control, name: "key" });

  const { maybeExecute: saveLetter } = useAsyncDebouncer(saveLetterAsync, {
    wait: 1000,
  });

  useEffect(() => {
    saveLetter({
      id: params.letter,
      key: key.length > 0 ? key : undefined,
      letter: text,
    });
  }, [text, key, params.letter, saveLetter]);

  useEffect(() => {
    if (isOpenLetterSuccess) {
      setValue("text", letterData);
      setValue("key", loaderData.key ?? "");
    }
  }, [setValue, loaderData.key, isOpenLetterSuccess, letterData]);

  useEffect(() => {
    if (saveLetterErrored) {
      setError("root", {
        message: `Failed to save letter: ${saveLetterError}`,
      });
      setValue("save", "❌");
    }
    if (saveLetterPending) setValue("save", "⏳");
    if (saveLetterSuccess) {
      clearErrors();
      setValue("save", "✅");
    }
  }, [
    setValue,
    setError,
    clearErrors,
    saveLetterErrored,
    saveLetterPending,
    saveLetterSuccess,
    saveLetterError,
  ]);

  if (openLetterLoading) {
    return (
      <main className="mx-auto flex flex-col items-center p-4 pt-8 lg:mx-16">
        <p>Loading...</p>
      </main>
    );
  } else {
    return (
      <main className="flex h-[calc(100vh_-_calc(var(--header-height)_/_4))] flex-col items-center p-4 pt-8 xl:mx-16">
        <div className="flex h-full w-full gap-4">
          <Prose
            articleClass="mx-auto w-1/2 p-2 h-full overflow-y-auto"
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
