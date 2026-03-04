export type VideoEmbed = {
  kind: "iframe" | "video" | "link";
  provider: string;
  url: string;
};

export type NoteMeta = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  permalink: string | null;
  published: boolean;
  updatedAt: string;
  videoEmbed: VideoEmbed | null;
  sourceFileId?: string | null;
  sourceModifiedTime?: string | null;
};

export type NoteDetail = NoteMeta & {
  content: string;
  frontmatter: Record<string, unknown>;
};

export type NotesResponse = {
  total: number;
  items: NoteMeta[];
};

export type SearchResult = {
  slug: string;
  title: string;
  excerpt: string;
  matchAreas: Array<"title" | "content" | "tags">;
  score: number;
  tags: string[];
  updatedAt: string;
};

export type SearchResponse = {
  total: number;
  items: SearchResult[];
};

export type CommentRecord = {
  id: string;
  note_slug: string;
  author_user_id: string;
  author_name: string;
  body_markdown: string;
  status: "visible" | "flagged" | "rejected";
  toxicity_score: number;
  created_at: string;
};

export type CommentsResponse = {
  total: number;
  items: CommentRecord[];
};
