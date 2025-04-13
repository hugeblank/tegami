import { cn } from "~/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export default function Media({
  src,
  alt,
  mime,
  dialog,
  className,
}: {
  src: string;
  alt?: string;
  mime?: string;
  dialog?: boolean;
  className?: string;
}) {
  const type = mime ? mime.split("/")[0] : "image";
  if (type === "video") {
    return (
      <video controls>
        <source src={src} type={mime} className={className} />
      </video>
    );
  } else if (type === "audio") {
    return (
      <audio controls>
        <source src={src} type={mime} className={className} />
      </audio>
    );
  }
  if (dialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <img src={src} alt={alt} className={className} />
        </DialogTrigger>
        <DialogContent
          className={"flex h-11/12 w-11/12 flex-col sm:max-w-[unset]"}
        >
          <DialogTitle hidden>{src}</DialogTitle>
          {alt && <DialogDescription>{alt}</DialogDescription>}
          <img
            src={src}
            alt={alt}
            className={cn("h-full w-full object-scale-down", className)}
          />
        </DialogContent>
      </Dialog>
    );
  }
  return <img src={src} alt={alt} className={className} />;
}
