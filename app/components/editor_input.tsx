import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState, type JSX } from "react";
import { MediaBrowser } from "./media_browser";
import { Button } from "./ui/button";
import {
  ClipboardCheck,
  Hourglass,
  OctagonMinus,
  Pencil,
  Share,
  SquareCheck,
} from "lucide-react";
import { toast } from "sonner";

const FormSchema = z.object({
  text: z.string(),
  key: z.string(),
  state: z.enum(["saved", "saving", "modified", "errored"]),
});

const stateElements = new Map<string, JSX.Element>(
  [
    <SquareCheck key="saved" className="text-green-500" />,
    <Pencil key="modified" className="text-yellow-500" />,
    <Hourglass key="saving" className="text-yellow-500" />,
    <OctagonMinus key="errored" className="text-red-500" />,
  ].map((element) => [element.key!, element]),
);

export type EditorSchema = z.infer<typeof FormSchema>;

export function useEditorForm() {
  return useForm<EditorSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      key: "",
      text: "",
      state: "saved",
    },
  });
}

export default function Editor({
  form,
  id,
  accessKey,
}: {
  form: UseFormReturn<EditorSchema>;
  id: string;
  accessKey?: string;
}) {
  const [inputType, setInputType] = useState<string | undefined>("password");
  const state = useWatch<EditorSchema>({
    control: form.control,
    name: "state",
  });
  const text = useWatch<EditorSchema>({ control: form.control, name: "text" });

  function onUpdate() {
    if (state !== "modified") form.setValue("state", "modified");
  }

  function onShare() {
    navigator.clipboard.writeText(
      document.location.href.replace("admin", "open"),
    );
    toast(<p>Link saved to clipboard</p>, {
      icon: <ClipboardCheck />,
    });
  }

  return (
    <Form {...form}>
      <form className="w-1/2">
        <div className="flex h-full w-full flex-col">
          <FormMessage />
          <div className="mx-4 mb-2 flex flex-col gap-2 lg:flex-row">
            <div className="flex gap-2">
              <p className="place-self-center">{stateElements.get(state)}</p>
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
                          onInput={onUpdate}
                        />
                      </FormControl>
                    </FormItem>
                  );
                }}
              />
            </div>
            <div className="flex gap-2">
              <MediaBrowser
                id={id}
                accessKey={accessKey}
                setText={(tag: string) => form.setValue("text", text + tag)}
              ></MediaBrowser>
              <Button type="button" onClick={onShare}>
                Share <Share />
              </Button>
            </div>
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
                      onCompositionUpdate={onUpdate}
                      onInput={onUpdate}
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
  );
}
