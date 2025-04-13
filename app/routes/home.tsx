import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import type { Route } from "./+types/home";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MailOpen } from "lucide-react";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png" },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "手紙" },
    { name: "description", content: "Welcome to my Jebsite!" },
  ];
}

const FormSchema = z.object({
  id: z.string(),
  accessKey: z.string(),
});

type FormType = z.infer<typeof FormSchema>;

export default function Home() {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: "",
      accessKey: "",
    },
  });

  const { exists: existsQuery, unlock: unlockQuery } = useTRPC().tegami;
  const watch = useWatch<FormType>({ control: form.control });
  const [sema, setSema] = useState(false);
  const exists = useQuery(
    existsQuery.queryOptions(sema && watch.id ? watch.id : skipToken),
  );
  const unlock = useQuery(
    unlockQuery.queryOptions(
      sema && watch.id
        ? {
            id: watch.id,
            key:
              watch.accessKey && watch.accessKey.length === 0
                ? undefined
                : watch.accessKey,
          }
        : skipToken,
    ),
  );
  const [letters, setLetters] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (sema && !exists.isLoading && !unlock.isLoading) {
      form.clearErrors();
      if (exists.isError || !exists.data) {
        form.setError("id", { message: "No matching letter with this ID" });
      } else if (unlock.isError || !unlock.data) {
        form.setError("accessKey", { message: "Incorrect key" });
      } else if (exists.isSuccess && unlock.isSuccess && unlock.data) {
        if (watch.accessKey) {
          localStorage.setItem(`letter-${watch.id}`, watch.accessKey);
        }
        navigate(`/open/${watch.id}`);
      }
      setSema(false);
    }
  }, [sema, setSema, form, exists, unlock, navigate, watch]);

  function onSubmit(data: FormType) {
    if (data.id.length === 0) {
      form.setError("id", { message: "Letter ID required" });
      return;
    } else if (!data.id.match(/[0-9a-f]{10}/)) {
      form.setError("id", { message: "Invalid Letter ID" });
    } else {
      setSema(true);
    }
  }

  useEffect(() => {
    const localletters = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if ((key && key.startsWith("letter-")) || key?.startsWith("cache-")) {
        localletters.push(key.split("-")[1]);
      }
    }
    setLetters(localletters);
  }, [setLetters]);

  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      <h1 className="pb-8 text-4xl">手紙へようこそ</h1>
      <h2 className="pb-4 text-2xl">Open a Letter:</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="after:text-red-500 after:content-['*']">
                    Letter
                  </FormLabel>
                  <div className="flex sm:flex-col md:flex-row">
                    <FormControl>
                      <Input type="text" placeholder="Letter ID" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
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
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <Button className="mt-2" type="submit">
            Open Letter <MailOpen />
          </Button>
        </form>
      </Form>
      {letters.length > 0 && <h2 className="py-4 text-2xl">Opened Letters:</h2>}
      {letters.map((v, i) => {
        return (
          <Link
            className="text-xl text-blue-500 hover:underline"
            to={`/open/${v}`}
            key={i}
          >
            {v}
          </Link>
        );
      })}
    </main>
  );
}
