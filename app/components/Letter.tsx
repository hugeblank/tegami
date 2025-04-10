import Markdown, { defaultUrlTransform } from "react-markdown";
import Image from "./Image";
import { useTRPC } from "~/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useEffect, useState } from "react";
import { Link } from "react-router";

function transform(id: string, key?: string): (url: string) => string {
  return (url: string) =>
    defaultUrlTransform(
      `/media/${id}/${url.replace(/^\.\//, "")}${key ? `?key=${key}` : ""}`,
    );
}

const components = {
  img: Image,
};

const FormSchema = z.object({
  accessKey: z.string(),
});

export default function Letter({ id }: { id: string }) {
  const openLetterQuery = useTRPC().tegami.open.queryOptions;
  const lsid = `letter-${id}`;

  const [key, setKeyState] = useState<string | undefined>(undefined);
  const getKeyAsAdmin = useQuery(useTRPC().tegami.getKey.queryOptions(id));
  useEffect(() => {
    if (getKeyAsAdmin.data) setKeyState(getKeyAsAdmin.data);
    if (!key) {
      const item = localStorage.getItem(lsid);
      if (item) setKeyState(item);
    }
  }, [getKeyAsAdmin.data, lsid]);

  const openLetter = useQuery(openLetterQuery({ id, key }));
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

  useEffect(() => {
    if (key === undefined || key.length === 0) {
      form.clearErrors("accessKey");
    } else if (!(openLetter.data || openLetter.isLoading)) {
      form.setError("accessKey", { message: "Incorrect access key" });
    }
  }, [key, openLetter.data, openLetter.isLoading]);

  if (!id.match(/[a-z0-9]{10}/)) {
    return (
      <>
        <h2 className="text-size-16 text-red-500">Invalid letter ID</h2>
        <Link to="/">Go back</Link>
      </>
    );
  }

  if (!key) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="accessKey"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <div className="flex sm:flex-col md:flex-row">
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Access Key"
                        {...field}
                      />
                    </FormControl>
                    <Button className="sm:mt-2 md:mt-0 md:ml-2" type="submit">
                      Submit
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </form>
      </Form>
    );
  } else {
    return (
      <article className="prose prose-img:rounded-md prose-code:rounded-md dark:prose-invert sm:prose-sm md:prose-md lg:prose-lg xl:prose-xl">
        <Markdown urlTransform={transform(id, key)} components={components}>
          {openLetter.data}
        </Markdown>
      </article>
    );
  }
}
