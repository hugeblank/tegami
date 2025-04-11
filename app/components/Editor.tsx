import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

const FormSchema = z.object({
  text: z.string(),
  key: z.string().optional(),
  save: z.string(),
});

export type EditorSchema = z.infer<typeof FormSchema>;

export function createForm() {
  return useForm<EditorSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text: "",
      save: "✅",
    },
  });
}

export default function Editor({
  form,
  onSubmit,
}: {
  form: UseFormReturn<EditorSchema>;
  onSubmit: (data: EditorSchema) => void;
}) {
  const [inputType, setInputType] = useState<string | undefined>("password");

  function onTextUpdate(e: React.CompositionEvent<HTMLTextAreaElement>) {
    form.setValue("text", e.currentTarget.value);
    // if (form.watch("save") !== "✏️") form.setValue("save", "✏️");
  }

  function onKeyUpdate(e: React.CompositionEvent<HTMLInputElement>) {
    form.setValue("key", e.currentTarget.value);
    // if (form.watch("save") !== "✏️") form.setValue("save", "✏️");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-1/2">
        <div className="flex h-full w-full flex-col">
          <FormMessage />
          <div className="mx-4 mb-2 flex flex-row gap-4">
            <p className="place-self-center">{form.watch("save")}</p>
            <Button type="submit">Save</Button>
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
                        onInput={onKeyUpdate}
                      />
                    </FormControl>
                  </FormItem>
                );
              }}
            />
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
                      onCompositionUpdate={onTextUpdate}
                      onInput={onTextUpdate}
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
