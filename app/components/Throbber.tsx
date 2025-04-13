import { LoaderCircle } from "lucide-react";

export default function Throbber({ large }: { large?: boolean }) {
  if (large)
    return (
      <div className="flex h-12 gap-2">
        <LoaderCircle className="h-8 w-8 animate-spin" />
        <p className="text-2xl">Loading...</p>
      </div>
    );

  return (
    <div className="flex gap-2">
      <LoaderCircle className="animate-spin" />
      <p>Loading...</p>
    </div>
  );
}
