import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { beginGoogleAuth, fetchComments, formatDate, postComment } from "../lib/api";
import { getCurrentSession, getSupabaseClient, isSupabaseClientConfigured } from "../lib/supabase";

type Props = {
  slug: string;
};

export function DiscussionSection({ slug }: Props) {
  const queryClient = useQueryClient();
  const [sessionToken, setSessionToken] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const commentsEnabled = useMemo(() => {
    return isSupabaseClientConfigured() && Boolean(import.meta.env.VITE_COMMENTS_ENABLED !== "false");
  }, []);

  useEffect(() => {
    if (!commentsEnabled) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    getCurrentSession().then((session) => {
      if (!session) {
        setSessionToken("");
        setAuthorName("");
        return;
      }
      setSessionToken(session.access_token);
      setAuthorName(
        session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email ||
          "User"
      );
    });

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setSessionToken("");
        setAuthorName("");
        return;
      }
      setSessionToken(session.access_token);
      setAuthorName(
        session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email ||
          "User"
      );
    });

    return () => {
      listener.data.subscription.unsubscribe();
    };
  }, [commentsEnabled]);

  const commentsQuery = useQuery({
    queryKey: ["comments", slug],
    queryFn: () => fetchComments(slug),
    enabled: commentsEnabled,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      return postComment({ slug, body, accessToken: sessionToken });
    },
    onSuccess: () => {
      setBody("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["comments", slug] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Failed to post comment");
    },
  });

  const signIn = async () => {
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { url } = await beginGoogleAuth(redirectTo);
      if (url) {
        window.location.href = url;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google login failed");
    }
  };

  return (
    <section className="discussion" aria-label="Discussion">
      <div className="discussion-head">
        <h2>Discussion</h2>
      </div>

      {!commentsEnabled ? (
        <p className="discussion-placeholder">
          Discussions are currently unavailable until Supabase credentials are enabled.
        </p>
      ) : null}

      {commentsEnabled && !sessionToken ? (
        <div className="discussion-auth">
          <p>Sign in with Google to join the discussion.</p>
          <button type="button" className="ghost-btn" onClick={signIn}>
            Sign in with Google
          </button>
        </div>
      ) : null}

      {commentsEnabled && sessionToken ? (
        <form
          className="discussion-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) {
              setError("Please enter a comment.");
              return;
            }
            postMutation.mutate();
          }}
        >
          <p className="discussion-author">Commenting as {authorName || "User"}</p>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share your thoughts"
            rows={4}
          />
          <div className="discussion-actions">
            <button type="submit" className="ghost-btn" disabled={postMutation.isPending}>
              {postMutation.isPending ? "Posting..." : "Post comment"}
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="state error">{error}</p> : null}

      {commentsEnabled && commentsQuery.isLoading ? <p className="state">Loading comments...</p> : null}
      {commentsEnabled && commentsQuery.isError ? (
        <p className="state error">Failed to load comments.</p>
      ) : null}

      <div className="discussion-list">
        {(commentsQuery.data?.items || []).map((comment) => (
          <article key={comment.id} className="discussion-item">
            <header>
              <strong>{comment.author_name}</strong>
              <span>{formatDate(comment.created_at)}</span>
            </header>
            {comment.status === "flagged" ? (
              <p className="discussion-flagged">This comment is under automated review.</p>
            ) : null}
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.body_markdown}</ReactMarkdown>
          </article>
        ))}
        {commentsEnabled && commentsQuery.data && commentsQuery.data.total === 0 ? (
          <p className="state">No comments yet.</p>
        ) : null}
      </div>
    </section>
  );
}
