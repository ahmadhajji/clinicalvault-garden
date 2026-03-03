require("dotenv").config();
const settings = require("../../helpers/constants");

const allSettings = settings.ALL_NOTE_SETTINGS;

const firstString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value)) {
      const stringInArray = value.find(
        (item) => typeof item === "string" && item.trim()
      );
      if (stringInArray) {
        return stringInArray.trim();
      }
    }
  }
  return "";
};

const toEmbedInfo = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  let urlString = rawValue;
  if (!/^https?:\/\//i.test(urlString) && /^www\./i.test(urlString)) {
    urlString = `https://${urlString}`;
  }

  let parsed;
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
    if (match && match[1]) {
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
};

module.exports = {
  eleventyComputed: {
    isPublished: (data) => {
      const publishFlag = data["dg-publish"];
      return publishFlag === true || publishFlag === "true";
    },
    eleventyExcludeFromCollections: (data) => !data.isPublished,
    layout: (data) => {
      if (!data.isPublished) {
        return false;
      }
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "layouts/index.njk";
      }
      return "layouts/note.njk";
    },
    permalink: (data) => {
      if (!data.isPublished) {
        return false;
      }
      if (data.tags.indexOf("gardenEntry") != -1) {
        return "/";
      }
      return data.permalink || undefined;
    },
    settings: (data) => {
      const noteSettings = {};
      allSettings.forEach((setting) => {
        let noteSetting = data[setting];
        let globalSetting = process.env[setting];

        let settingValue =
          noteSetting || (globalSetting === "true" && noteSetting !== false);
        noteSettings[setting] = settingValue;
      });
      return noteSettings;
    },
    videoEmbed: (data) => {
      const raw = firstString(
        data["video link"],
        data.video_link,
        data.videoLink,
        data["video-link"],
        data["video url"],
        data["video-url"],
        data.video
      );
      return toEmbedInfo(raw);
    },
  },
};
