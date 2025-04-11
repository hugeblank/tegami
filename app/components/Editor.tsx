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
import { useState } from "react";
import MediaPopup from "./MediaPopup";

const FormSchema = z.object({
  text: z.string(),
  key: z.string(),
  save: z.string(),
});

export type EditorSchema = z.infer<typeof FormSchema>;

export function useEditorForm() {
  return useForm<EditorSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      key: "",
      text: "",
      save: "✅",
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
  const save = useWatch<EditorSchema>({ control: form.control, name: "save" });

  function onUpdate() {
    if (save !== "✏️") form.setValue("save", "✏️");
  }

  return (
    <Form {...form}>
      <form className="w-1/2">
        <div className="flex h-full w-full flex-col">
          <FormMessage />
          <div className="mx-4 mb-2 flex flex-row gap-4">
            <p className="place-self-center">{save}</p>
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
            <MediaPopup id={id} accessKey={accessKey}></MediaPopup>
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
