export type NoteMeta = {
  slug: string;
  title: string;
  tags: string[];
  excerpt: string;
  permalink: string | null;
  published: boolean;
  updatedAt: string;
};

export type NoteDetail = NoteMeta & {
  content: string;
  frontmatter: Record<string, unknown>;
};

export type NotesResponse = {
  total: number;
  items: NoteMeta[];
};
