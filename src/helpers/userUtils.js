function parseDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDateLabel(date) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function normalizeTagList(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags;
  }

  return [tags];
}

function userComputed(data) {
  const notesCollection = data.collections?.note || [];
  const notes = notesCollection
    .filter((entry) => entry && entry.url && entry.url !== "/")
    .map((entry) => {
      const publishedDate = parseDate(entry.data?.published);
      const updatedDate = parseDate(entry.data?.updated);
      const fallbackDate = parseDate(entry.date);
      const sortDate = publishedDate || updatedDate || fallbackDate;

      return {
        title: entry.data?.title || entry.fileSlug,
        url: entry.url,
        sortDate,
        dateLabel: formatDateLabel(sortDate),
        tags: normalizeTagList(entry.data?.tags),
        fileSlug: (entry.fileSlug || "").toLowerCase(),
      };
    });

  notes.sort((a, b) => {
    const aTime = a.sortDate ? a.sortDate.getTime() : 0;
    const bTime = b.sortDate ? b.sortDate.getTime() : 0;
    return bTime - aTime;
  });

  const latestNotes = notes.slice(0, 8).map((note) => ({
    title: note.title,
    url: note.url,
    dateLabel: note.dateLabel,
  }));

  const tagCounts = new Map();
  for (const note of notes) {
    for (const tag of note.tags) {
      if (!tag || tag === "note" || tag === "gardenEntry") {
        continue;
      }

      const normalized = String(tag).trim();
      if (!normalized) {
        continue;
      }

      tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
    }
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 16);

  const aboutNote = notes.find((note) => {
    return note.fileSlug === "about" || note.fileSlug === "about-me" || note.fileSlug === "about me";
  });

  return {
    latestNotes,
    topTags,
    aboutUrl: aboutNote ? aboutNote.url : null,
  };
}

exports.userComputed = userComputed;
