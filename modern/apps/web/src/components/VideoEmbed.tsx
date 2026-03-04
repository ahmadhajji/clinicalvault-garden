import type { VideoEmbed as VideoEmbedType } from "../types";

type Props = {
  videoEmbed: VideoEmbedType;
};

export function VideoEmbed({ videoEmbed }: Props) {
  return (
    <section className="cv-video-embed" aria-label="Note video">
      <div className="cv-video-embed-head">
        <p className="cv-video-embed-label">Video</p>
        <span className="cv-video-embed-provider">{videoEmbed.provider}</span>
      </div>

      {videoEmbed.kind === "video" ? (
        <video controls preload="metadata" playsInline src={videoEmbed.url} />
      ) : null}

      {videoEmbed.kind === "iframe" ? (
        <div className="cv-video-frame">
          <iframe
            src={videoEmbed.url}
            title="Embedded note video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}

      {videoEmbed.kind === "link" ? (
        <p className="cv-video-link-fallback">
          Open video: <a href={videoEmbed.url}>{videoEmbed.url}</a>
        </p>
      ) : null}
    </section>
  );
}
