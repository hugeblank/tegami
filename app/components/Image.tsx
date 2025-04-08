import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { type HTMLProps } from "react";

export default function Image(props: HTMLProps<HTMLImageElement>) {
  return (
    <Dialog>
      <DialogTitle>{props.alt}</DialogTitle>
      <DialogTrigger asChild>
        <img {...props} />
      </DialogTrigger>
      <DialogContent className="absolute top-0">
        <img {...props} />
      </DialogContent>
    </Dialog>
  );
}
