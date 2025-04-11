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

export default function ImageCard({
  id,
  accessKey,
  info,
  refresh,
}: {
  id: string;
  accessKey?: string;
  info: { name: string; type: string };
  refresh: () => unknown;
}) {
  const removeImage = useMutation(useTRPC().tegami.delete.mutationOptions());

  async function onDelete() {
    await removeImage.mutateAsync({ id, name: info.name });
    refresh();
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
        <Button type="button" variant="secondary">
          Insert
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
