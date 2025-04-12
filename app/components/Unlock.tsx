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
  const { checkKey, unlock } = useTRPC().tegami;
  const lsid = `letter-${id}`;
  const [access, setAccess] = accessState;

  const {
    isSuccess: checkKeySuccess,
    data: keyResult,
    isLoading: checkKeyLoading,
  } = useQuery(checkKey.queryOptions(id));

  // Attempt to load key from localStorage
  useEffect(() => {
    if (checkKeySuccess) setAccess(keyResult.key);
    const item = localStorage.getItem(lsid);
    if (item) setAccess(item);
  }, [checkKeySuccess, keyResult, lsid, setAccess]);

  const { data: unlockedLetter, isLoading: letterLoading } = useQuery(
    unlock.queryOptions({ id, key: access }),
  );

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accessKey: "",
    },
  });

  // If the key from localStorage fails, handle form
  useEffect(() => {
    if (unlockedLetter === false && localStorage.getItem(lsid) !== null) {
      localStorage.removeItem(lsid);
      setAccess(undefined);
    }

    if (!access || access.length === 0) {
      form.clearErrors("accessKey");
    } else if (!(unlockedLetter || letterLoading)) {
      form.setError("accessKey", { message: "Incorrect access key" });
    }
  }, [access, setAccess, form, lsid, unlockedLetter, letterLoading]);

  if (!access && (checkKeyLoading || letterLoading)) {
    return <p>Loading...</p>;
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setAccess(data.accessKey);
    localStorage.setItem(lsid, data.accessKey);
  }

  if (!access && keyResult?.has) {
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
