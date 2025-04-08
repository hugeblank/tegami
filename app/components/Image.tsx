import { type HTMLProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function Image(props: HTMLProps<HTMLImageElement>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <img {...props} />
      </DialogTrigger>
      <DialogContent className="mx-auto flex h-11/12 w-11/12 flex-col sm:max-w-[unset]">
        <DialogHeader>
          <DialogTitle>{props.alt}</DialogTitle>
        </DialogHeader>
        <img {...props} className="h-full w-full object-scale-down" />
      </DialogContent>
    </Dialog>
  );
}
