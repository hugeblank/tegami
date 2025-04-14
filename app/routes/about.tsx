import Media from "~/components/media";
import type { Route } from "./+types/about";

export default function About({}: Route.LoaderArgs) {
  return (
    <main className="container mx-auto flex flex-col items-center p-4 pt-8">
      <p className="w-full py-2 lg:w-256">
        Tegami (手紙) is a small web app for writing and self-hosting password
        protected letters and unlisted blog posts. Writing long well thought out
        messages in the DM feature of most social media apps is usually
        cumbersome and awkward, Tegami provides the feature richness of a
        markdown editor, with the discreteness of a direct message. It&apos;s
        just a letter with a lock.
      </p>
      <h2 className="mt-4 mb-2 block text-xl font-semibold">Usage</h2>
      <p className="w-full py-2 lg:w-256">
        On the home page if you&apos;re not provided a link, you can input a
        letter ID and key. Letters that you have previously opened will appear
        below the form. If you <i>are</i> given a link, on first open
        you&apos;ll be asked for a key similar to the bottom half of the home
        page form shown below.
      </p>
      <Media
        className="rounded-xl border"
        src="/static/home.png"
        alt="Home page letter selection menu"
        dialog
      />
      <h2 className="mt-4 mb-2 block text-xl font-semibold">Editor</h2>
      <p className="w-full py-2 lg:w-256">
        As the site operator, you start by picking a username and password and
        putting it in the <code>AUTH</code> environment variable, separated by a
        colon (<code>&lt;username&gt;:&lt;password&gt;</code>). To get to the
        editor, navigate to <code>/admin</code>
        and provide the same credentials used for the <code>AUTH</code>{" "}
        environment variable. The admin panel provides the option to create a
        letter, as well as edit existing letters. This is what the editor looks
        like, using a document written while prototyping the media viewer:
      </p>
      <Media
        className="rounded-xl border"
        src="/static/editor.png"
        alt="Editor preview"
        dialog
      />
      <p className="w-full py-2 lg:w-256">
        The media viewer is where you can upload and delete media from the
        letter. This is what that media viewer looks like:
      </p>
      <Media
        className="rounded-xl border"
        src="/static/media.png"
        alt="Media viewer with upload button, and insert and delete buttons on each piece of media"
        dialog
      />
    </main>
  );
}
