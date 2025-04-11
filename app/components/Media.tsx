export default function Media({
  src,
  alt,
  mime,
  className,
}: {
  src: string;
  alt?: string;
  mime?: string;
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
  return <img src={src} alt={alt} className={className} />;
}
