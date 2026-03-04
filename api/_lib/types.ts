export type VideoEmbed = {
  kind: "iframe" | "video" | "link";
  provider: string;
  url: string;
};

export type Frontmatter = Record<string, unknown>;

export type NoteRecord = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  content: string;
  permalink: string | null;
  published: boolean;
  updatedAt: string;
  frontmatter: Frontmatter;
  videoEmbed: VideoEmbed | null;
  sourceFileId?: string | null;
  sourceModifiedTime?: string | null;
};

export type NoteMeta = Omit<NoteRecord, "content" | "frontmatter">;

export type CommentStatus = "visible" | "flagged" | "rejected";

export type CommentRecord = {
  id: string;
  note_slug: string;
  author_user_id: string;
  author_name: string;
  body_markdown: string;
  status: CommentStatus;
  toxicity_score: number;
  created_at: string;
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
