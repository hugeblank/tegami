import { type HTMLProps } from "react";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";

export default function ImageDialog(props: HTMLProps<HTMLImageElement>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <img {...props} />
      </DialogTrigger>
      <DialogContent className="flex h-11/12 w-11/12 flex-col sm:max-w-[unset]">
        <img {...props} className="h-full w-full object-scale-down" />
        <DialogDescription>{props.alt}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
