import { useTRPC } from "~/lib/trpc";
import { skipToken, useQuery } from "@tanstack/react-query";
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
import type { KeyCheck } from "~/util/misc";
import { MailOpen } from "lucide-react";
import Throbber from "./throbber";

const FormSchema = z.object({
  accessKey: z.string(),
});

export default function Unlock({
  id,
  accessState,
}: {
  id: string;
  accessState: [
    KeyCheck | undefined,
    React.Dispatch<React.SetStateAction<KeyCheck | undefined>>,
  ];
}) {
  const { checkKey, unlock } = useTRPC();
  const lsid = `letter-${id}`;
  const [access, setAccess] = accessState;
  const [attemptUnlock, setAttempt] = useState<KeyCheck>();
  const [localAttempt, setLocalAttempt] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      accessKey: "",
    },
  });

  const {
    // Check if there's a key at all. If authed, key is provided.
    isSuccess: checkKeySuccess,
    data: keyResult,
    isLoading: checkKeyLoading,
  } = useQuery(checkKey.queryOptions(id));

  const {
    // Attempt to unlock the letter with the given key
    data: unlocked,
    isLoading: unlockLoading,
    isSuccess: unlockQuerySuccess,
  } = useQuery(
    unlock.queryOptions(
      attemptUnlock ? { id, key: attemptUnlock.key } : skipToken,
    ),
  );

  // Attempt to load key from localStorage
  useEffect(() => {
    if (!attemptUnlock && !localAttempt) {
      // If no attempt at a local unlock has been attempted
      if (checkKeySuccess && keyResult.has) {
        // And the server says there is a key
        if (keyResult.key) {
          // And it's being provided, just set it.
          setAccess(keyResult);
          setLocalAttempt(true);
        } else {
          // Otherwise we have to guess, starting from localStorage
          const item = localStorage.getItem(lsid);
          if (item) {
            setAttempt({ has: true, key: item });
            setLocalAttempt(true);
          }
        }
      } else if (checkKeySuccess) {
        // Otherwise if there is not a key
        localStorage.setItem(`cache-${id}`, "");
        setAccess(keyResult);
        setLocalAttempt(true);
      }
    }

    // If a local unlock has been attempted, and didn't unlock the letter
    if (attemptUnlock && localAttempt && unlockQuerySuccess && !unlocked) {
      // clear localStorage & reset attempt
      localStorage.removeItem(lsid);
      setAttempt(undefined);
    }

    // If the given attempt successfully unlocked the letter
    if (attemptUnlock && unlockQuerySuccess && unlocked) {
      // Pass it along to access & set it in localStorage
      setAccess(attemptUnlock);
      if (attemptUnlock.key) localStorage.setItem(lsid, attemptUnlock.key);
    }
  }, [
    checkKeySuccess,
    keyResult,
    lsid,
    attemptUnlock,
    setAccess,
    setLocalAttempt,
    unlockQuerySuccess,
    unlocked,
    localAttempt,
    id,
  ]);

  // Handle form
  useEffect(() => {
    if (
      !attemptUnlock ||
      !attemptUnlock.key ||
      attemptUnlock.key.length === 0
    ) {
      form.clearErrors("accessKey");
    } else if (!unlocked && unlockQuerySuccess) {
      form.setError("accessKey", { message: "Incorrect access key" });
    }
  }, [attemptUnlock, form, unlockQuerySuccess, unlocked]);

  if (checkKeyLoading && unlockLoading) {
    return <Throbber />;
  }

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setAttempt({ has: true, key: data.accessKey });
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
    );
  }
}
