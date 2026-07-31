

export const highlightSearchText = (
  text,
  messageSearchQuery
) => {
  if (
    !text ||
    !messageSearchQuery ||
    !messageSearchQuery.trim()
  ) {
    return text;
  }

  const query = messageSearchQuery.trim();

  // Escape special regex characters
  const escapedQuery = query.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `(${escapedQuery})`,
    "gi"
  );

  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark
        key={index}
        className="message-search-highlight"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};