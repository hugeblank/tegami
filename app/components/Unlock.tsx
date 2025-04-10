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
import { useEffect } from "react";

const FormSchema = z.object({
  accessKey: z.string(),
});

export default function Unlock({
  id,
  accessState,
}: {
  id: string;
  accessState: [
    string | undefined,
    React.Dispatch<React.SetStateAction<string | undefined>>,
  ];
}) {
  const trpc = useTRPC();
  const lsid = `letter-${id}`;
  const [access, setAccess] = accessState;

  const checkKey = useQuery(trpc.tegami.checkKey.queryOptions(id));
  useEffect(() => {
    if (checkKey.isSuccess) setAccess(checkKey.data.key);
    const item = localStorage.getItem(lsid);
    if (item) setAccess(item);
  }, [checkKey.isSuccess, checkKey.data, lsid]);

  const unlockLetter = useQuery(
    trpc.tegami.unlock.queryOptions({ id, key: access }),
  );
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accessKey: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setAccess(data.accessKey);
    localStorage.setItem(lsid, data.accessKey);
  }

  useEffect(() => {
    if (unlockLetter.data === false && localStorage.getItem(lsid) !== null) {
      localStorage.removeItem(lsid);
      setAccess(undefined);
    }

    if (!access || access.length === 0) {
      form.clearErrors("accessKey");
    } else if (!(unlockLetter.data || unlockLetter.isLoading)) {
      form.setError("accessKey", { message: "Incorrect access key" });
    }
  }, [access, unlockLetter.data, unlockLetter.isLoading]);

  if (!access && (checkKey.isLoading || unlockLetter.isLoading)) {
    return <p>Loading...</p>;
  }

  if (!access && checkKey.data?.has) {
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
  }
}
