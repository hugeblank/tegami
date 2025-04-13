import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import MediaCard from "./ImageCard";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc";
import { useSubmit } from "react-router";
import { Image, ImageUp } from "lucide-react";
import Throbber from "./Throbber";

export type UploadSchema = {
  media: number | string | readonly string[] | undefined;
};

const mimes = [
  "image/png",
  "image/jpeg",
  "video/mp4",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/webm",
  "video/webm",
  "image/webp",
  "audio/aac",
  "audio/ogg",
].join(",");

export default function MediaPopup({
  id,
  accessKey,
  setText: appendText,
}: {
  id: string;
  accessKey?: string;
  setText: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const listMedia = useQuery(useTRPC().tegami.listMedia.queryOptions(id));
  const submit = useSubmit();

  async function onInput() {
    await submit(formRef.current, {
      action: `/admin/${id}`,
      method: "post",
      encType: "multipart/form-data",
    });
    listMedia.refetch();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          Media <Image />
        </Button>
      </DialogTrigger>
      <DialogContent className="h-11/12 w-11/12 content-start sm:max-w-[unset]">
        <DialogHeader className="h-10 flex-row place-items-center gap-4">
          <div className="flex flex-col">
            <DialogTitle className="text-2xl font-bold">
              Browse Media
            </DialogTitle>
            <DialogDescription>Media for this Tegami</DialogDescription>
          </div>
          <form ref={formRef}>
            <input
              hidden
              name="media"
              type="file"
              accept={mimes}
              ref={inputRef}
              onChange={onInput}
            />
            <Button type="button" onClick={() => inputRef.current?.click()}>
              Upload <ImageUp />
            </Button>
          </form>
        </DialogHeader>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(32rem,0fr)_)] place-content-start gap-4 overflow-y-scroll">
          {listMedia.isSuccess ? (
            listMedia.data.map((info, i) => (
              <MediaCard
                id={id}
                key={i}
                accessKey={accessKey}
                appendText={appendText}
                info={info}
                refresh={listMedia.refetch}
              ></MediaCard>
            ))
          ) : listMedia.isLoading ? (
            <Throbber />
          ) : (
            <p className="text-red-500">
              Uh oh! Error while loading media cards. Please refresh the page.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
