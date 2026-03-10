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
import { MailOpen } from "lucide-react";
import Throbber from "./throbber";

const FormSchema = z.object({
  accessKey: z.string().optional(),
});

export default function Unlock({
  id,
  accessState: [, setAccess],
  setOpen,
}: {
  id: string;
  accessState: [
    string | undefined,
    React.Dispatch<React.SetStateAction<string | undefined>>,
  ];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { unlock } = useTRPC();
  const lsid = `letter-${id}`;
  const [attempt, setAttempt] = useState<string>();
  const [localUsed, setLocalAttempt] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accessKey: "",
    },
  });

  const {
    // Attempt to unlock the letter with the given key
    data: unlocked,
    isLoading: unlockLoading,
    isSuccess: unlockQuerySuccess,
  } = useQuery(unlock.queryOptions({ id, key: attempt }));

  // Attempt to load key from localStorage
  useEffect(() => {
    if (!localUsed) {
      if (typeof attempt !== "string") {
        // Attempt unlock from localStorage
        const item = localStorage.getItem(lsid);
        if (item) setAttempt(item);
      }
      if (unlockQuerySuccess) {
        // If the given attempt successfully unlocked the letter
        if (unlocked) {
          // Pass it along to access & set it in localStorage
          if (attempt) {
            localStorage.removeItem(`cache-${id}`);
            localStorage.setItem(lsid, attempt);
          } else {
            localStorage.removeItem(lsid);
            localStorage.setItem(`cache-${id}`, "");
          }
          setAccess(attempt);
          setOpen(true);
        }
        setLocalAttempt(true);
      }
    }
  }, [
    lsid,
    attempt,
    setLocalAttempt,
    unlockQuerySuccess,
    unlocked,
    localUsed,
    id,
    setAccess,
    setOpen,
  ]);

  // Handle form
  useEffect(() => {
    console.log(attempt);
    if (typeof attempt !== "string") {
      form.clearErrors("accessKey");
    } else if (!unlocked && unlockQuerySuccess) {
      form.setError("accessKey", { message: "Incorrect access key" });
    } else if (unlocked && unlockQuerySuccess) {
      localStorage.removeItem(`cache-${id}`);
      localStorage.setItem(lsid, attempt);
      setAccess(attempt);
      setOpen(true);
    }
  }, [
    attempt,
    setOpen,
    form,
    setAccess,
    unlockQuerySuccess,
    unlocked,
    lsid,
    id,
  ]);

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setAttempt(data.accessKey);
  }

  if (!unlocked) {
    return (
      <>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="accessKey"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Access Key"
                          {...field}
                        />
                      </FormControl>
                      <Button type="submit">
                        Open Letter <MailOpen />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </form>
        </Form>
        {unlockLoading && <Throbber />}
      </>
    );
  }
}
