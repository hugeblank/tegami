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
import Media from "./Media";
import { SquareCheck } from "lucide-react";
import { useState } from "react";

export default function MediaCard({
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
