import type { Frontmatter, VideoEmbed } from "./types";

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string" && item.trim());
      if (typeof first === "string") {
        return first.trim();
      }
    }
  }
  return "";
}

function firstLikelyVideoValue(frontmatter: Frontmatter): string {
  const direct = firstString(
    frontmatter["video link"],
    frontmatter.video_link,
    frontmatter.videoLink,
    frontmatter["video-link"],
    frontmatter["video url"],
    frontmatter["video-url"],
    frontmatter.video
  );
  if (direct) {
    return direct;
  }

  const keyMatches = (key: string): boolean => {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
    return (
      normalized === "videolink" ||
      normalized === "videourl" ||
      normalized === "videoembed" ||
      normalized === "videolinkurl"
    );
  };

  for (const [key, value] of Object.entries(frontmatter || {})) {
    if (!keyMatches(key)) {
      continue;
    }

    const fromValue = firstString(value);
    if (fromValue) {
      return fromValue;
    }

    if (value && typeof value === "object" && "url" in value) {
      const url = (value as { url?: unknown }).url;
      if (typeof url === "string" && url.trim()) {
        return url.trim();
      }
    }
  }

  return "";
}

export function toVideoEmbed(frontmatter: Frontmatter): VideoEmbed | null {
  const raw = firstLikelyVideoValue(frontmatter);
  if (!raw) {
    return null;
  }

  let urlString = String(raw).trim();
  const markdownLinkMatch = urlString.match(/\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/i);
  if (markdownLinkMatch?.[1]) {
    urlString = markdownLinkMatch[1].trim();
  }

  if (urlString.startsWith("<") && urlString.endsWith(">")) {
    urlString = urlString.slice(1, -1).trim();
  }

  if (!/^https?:\/\//i.test(urlString) && /^www\./i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (host === "youtu.be" || host.includes("youtube.com")) {
    let videoId = "";
    if (host === "youtu.be") {
      videoId = path.split("/").filter(Boolean)[0] || "";
    } else if (path.startsWith("/watch")) {
      videoId = parsed.searchParams.get("v") || "";
    } else if (path.startsWith("/shorts/")) {
      videoId = path.split("/")[2] || "";
    } else if (path.startsWith("/embed/")) {
      videoId = path.split("/")[2] || "";
    }

    if (videoId) {
      return {
        kind: "iframe",
        provider: "YouTube",
        url: `https://www.youtube.com/embed/${videoId}`,
      };
    }
  }

  if (host.includes("vimeo.com")) {
    const match = path.match(/\/(?:video\/)?(\d+)/);
    if (match?.[1]) {
      return {
        kind: "iframe",
        provider: "Vimeo",
        url: `https://player.vimeo.com/video/${match[1]}`,
      };
    }
  }

  if (host.includes("drive.google.com")) {
    const fileMatch = path.match(/\/file\/d\/([^/]+)/);
    const fileId = fileMatch?.[1] || parsed.searchParams.get("id");
    if (fileId) {
      return {
        kind: "iframe",
        provider: "Google Drive",
        url: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(urlString)) {
    return {
      kind: "video",
      provider: "Video",
      url: urlString,
    };
  }

  return {
    kind: "link",
    provider: "Video Link",
    url: urlString,
  };
}
