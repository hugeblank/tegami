import { useNavigate } from "react-router";
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
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { useEffect, useState } from "react";

const FormSchema = z.object({
  username: z.string(),
  password: z.string(),
});

type FormType = z.infer<typeof FormSchema>;

export default function Root() {
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [token, setToken] = useState<string | undefined>();
  const { isSuccess, data } = useQuery(
    useTRPC().tegami.auth.queryOptions(token || skipToken),
  );
  // const { submit } = useFetcher<typeof action>();
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess && token) {
      if (data) {
        const formData = new FormData();
        formData.append("token", token);
        // submit(formData, { method: "post" });
        navigate("/admin");
      } else {
        form.setError("root", { message: "Invalid username or password" });
      }
    }
  }, [isSuccess, data, token, navigate, form]);

  async function onSubmit(data: FormType) {
    if (data.username.length === 0) {
      form.setError("username", { message: "Username required" });
    } else if (data.password.length === 0) {
      form.setError("password", { message: "Password required" });
    } else {
      const vals = form.getValues();
      setToken(btoa(vals.username + ":" + vals.password));
    }
  }

  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      <h1 className="pb-8 text-4xl">Log in as Admin</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="after:text-red-500 after:content-['*']">
                    Username
                  </FormLabel>
                  <div className="flex sm:flex-col md:flex-row">
                    <FormControl>
                      <Input type="text" placeholder="Username" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel className="after:text-red-500 after:content-['*']">
                    Password
                  </FormLabel>
                  <div className="flex sm:flex-col md:flex-row">
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          {form.formState.errors.root && (
            <p role="alert" className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button className="mt-2" type="submit">
            Log in
          </Button>
        </form>
      </Form>
    </main>
  );
}
