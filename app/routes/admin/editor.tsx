import { components, transform } from "~/components/Letter";
import type { Route } from "./+types/editor";
import { isAuthed } from "~/api/login";
import { checkKey } from "~/api/key";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { Link } from "react-router";
import { Textarea } from "~/components/ui/textarea";
import Prose from "~/components/Prose";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Button } from "~/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/components/ui/input";
import { useEffect, useState } from "react";
import { headerHeight } from "~/root";

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

const FormSchema = z.object({
  text: z.string(),
  key: z.string().optional(),
});

export default function Editor({ params, loaderData }: Route.ComponentProps) {
  const trpc = useTRPC();

  const letterExists = useQuery(trpc.tegami.exists.queryOptions(params.letter));

  const saveLetter = useMutation(trpc.tegami.save.mutationOptions());

  const openLetter = useQuery(
    trpc.tegami.open.queryOptions({ id: params.letter, key: loaderData.key }),
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text: "",
    },
  });

  const [text, setText] = useState("");
  const [key, setKey] = useState(loaderData.key);
  const [saved, setSaved] = useState("✅"); //⏳❌✏️
  const [inputType, setInputType] = useState<string | undefined>("password");

  useEffect(() => {
    if (openLetter.data) {
      form.setValue("text", openLetter.data);
      setText(openLetter.data);
    }
  }, [openLetter.data]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
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
      setSaved("❌");
    }
  }, [saveLetter.error, saveLetter.isError]);

  useEffect(() => {
    if (saveLetter.isPending) setSaved("⏳");
    if (saveLetter.isSuccess) {
      form.clearErrors();
      setSaved("✅");
    }
  }, [saveLetter.isPending, saveLetter.isSuccess]);

  function onTextUpdate(e: React.CompositionEvent<HTMLTextAreaElement>) {
    setText(e.currentTarget.value);
    if (saved !== "✏️") setSaved("✏️");
  }

  function onKeyUpdate(e: React.CompositionEvent<HTMLInputElement>) {
    setKey(e.currentTarget.value);
    if (saved !== "✏️") setSaved("✏️");
  }

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
          {/* <ScrollArea className="w-1/2"> */}
          <Prose
            articleClass="mx-20 h-full overflow-y-auto"
            urlTransform={transform(params.letter, loaderData.key)}
            components={components}
          >
            {text}
          </Prose>
          {/* </ScrollArea> */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/2">
              <div className="flex h-full w-full flex-col">
                <FormMessage />
                <div className="mx-4 mb-2 flex flex-row gap-4">
                  <p className="place-self-center">{saved}</p>
                  <Button type="submit">Save</Button>
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => {
                      return (
                        <FormItem className="flex gap-1">
                          <FormLabel>Key:</FormLabel>
                          <FormControl>
                            <Input
                              className="w-fit"
                              placeholder="Access Key"
                              type={inputType}
                              onFocus={() => setInputType(undefined)}
                              {...field}
                              onBlur={() => {
                                setInputType("password");
                                field.onBlur();
                              }}
                              onInput={onKeyUpdate}
                              value={key}
                            />
                          </FormControl>
                        </FormItem>
                      );
                    }}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => {
                    return (
                      <FormItem className="h-full">
                        <FormControl>
                          <Textarea
                            className="h-full"
                            placeholder="What's going on?"
                            onCompositionUpdate={onTextUpdate}
                            onInput={onTextUpdate}
                            {...field}
                          ></Textarea>
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
              </div>
            </form>
          </Form>
        </div>
      </main>
    );
  }
}
