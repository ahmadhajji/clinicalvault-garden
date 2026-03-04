import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { fetchNote, formatDate } from "../lib/api";
import { VideoEmbed } from "../components/VideoEmbed";
import { DiscussionSection } from "../components/DiscussionSection";

export function NoteRoute() {
  const params = useParams();
  const slug = decodeURIComponent(params["*"] || "").replace(/^\/+|\/+$/g, "");

  const noteQuery = useQuery({
    queryKey: ["note", slug],
    queryFn: () => fetchNote(slug),
    enabled: Boolean(slug),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  if (!slug) {
    return (
      <main className="note-page">
        <p className="state error">Invalid note path.</p>
      </main>
    );
  }

  if (noteQuery.isLoading) {
    return (
      <main className="note-page">
        <p className="state">Loading note...</p>
      </main>
    );
  }

  if (noteQuery.isError || !noteQuery.data) {
    return (
      <main className="note-page">
        <p className="state error">Note not found.</p>
        <Link className="ghost-btn" to="/">
          Back to library
        </Link>
      </main>
    );
  }

  const note = noteQuery.data;

  return (
    <main className="note-page">
      <div className="note-toolbar">
        <Link className="ghost-btn" to="/">
          Back to library
        </Link>
        <div className="note-toolbar-meta">
          <span>{formatDate(note.updatedAt)}</span>
          {!note.published ? <span className="draft-pill">Draft</span> : null}
        </div>
      </div>

      <article className="note-article">
        <header>
          <h1>{note.title}</h1>
          {note.tags.length > 0 ? (
            <div className="note-tags">
              {note.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {note.videoEmbed ? <VideoEmbed videoEmbed={note.videoEmbed} /> : null}

        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {note.content}
        </ReactMarkdown>
      </article>

      <DiscussionSection slug={note.slug} />
    </main>
  );
}
