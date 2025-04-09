import Markdown, { defaultUrlTransform } from "react-markdown";
import Image from "./Image";
import { useTRPC } from "~/lib/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { Form } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormField, FormItem, FormLabel } from "./ui/form";

function transform(id: string, key: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(`/media/${id}/${url.replace(/^\.\//, "")}?key=${key}`);
}

const components = {
  img: Image,
};

const FormSchema = z.object({
  accessKey: z.string(),
});

export default function Letter({ id }: { id: string }) {
  if (!id.match(/[a-z0-9]{10}/)) throw new Error("Invalid letter identifier");
  const openLetterQuery = useTRPC().tegami.open.queryOptions;
  const lsid = `letter-${id}`;
  const [key, setKeyState] = useState(localStorage.getItem(lsid));
  const openLetter = useQuery(openLetterQuery(key ? { id, key } : skipToken));

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accessKey: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setKeyState(data.accessKey);
    localStorage.setItem(lsid, data.accessKey);
  }

  return !key ? (
    <>
      <div className="flex">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="accessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Access Key" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit"></Button>
          </form>
        </Form>
      </div>
    </>
  ) : (
    <article className="prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl">
      <Markdown urlTransform={transform(id, key)} components={components}>
        {openLetter.data}
      </Markdown>
    </article>
  );
}
