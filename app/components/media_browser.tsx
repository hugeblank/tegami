import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { useTRPC } from "~/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { Media } from "./media";
import { SquareCheck } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSubmit } from "react-router";
import { Image, ImageUp } from "lucide-react";
import Throbber from "./throbber";

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

export function MediaBrowser({
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
            listMedia.data.map((info) => (
              <MediaCard
                id={id}
                key={info.name}
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

export function MediaCard({
  id,
  accessKey,
  info,
  appendText,
  refresh,
}: {
  id: string;
  accessKey?: string;
  appendText: (text: string) => void;
  info: { name: string; type: string };
  refresh: () => unknown;
}) {
  const removeMedia = useMutation(
    useTRPC().tegami.deleteMedia.mutationOptions(),
  );
  const [inserted, setInsert] = useState(false);

  async function onDelete() {
    await removeMedia.mutateAsync({ id, name: info.name });
    refresh();
  }

  function onInsert() {
    appendText(`\n![media](./${info.name})`);
    setInsert(true);
  }

  function onHoverExit() {
    setInsert(false);
  }

  return (
    <Card className="h-132 max-h-132 w-128 max-w-128 gap-3">
      <CardHeader className="h-8">
        <CardTitle>{info.name}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-100 grow justify-center">
        <Media
          src={`/media/${id}/${info.name}?key=${accessKey}`}
          className="h-full w-full object-scale-down"
          mime={info.type}
        />
      </CardContent>
      <CardFooter className="h-fit gap-2 self-center">
        <Button
          type="button"
          variant="secondary"
          onClick={onInsert}
          onMouseLeave={onHoverExit}
        >
          Insert{" "}
          {inserted ? (
            <SquareCheck className="stroke-background fill-foreground" />
          ) : (
            <SquareCheck />
          )}
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
