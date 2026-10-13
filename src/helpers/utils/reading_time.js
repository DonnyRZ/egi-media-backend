/** Reading metadata comes from full localized content, never a teaser/summary. */
function calculateReadingTime(content) {
  if (typeof content !== "string" || !content.trim()) return null;
  const visible = content.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, " ");
  const words = visible.match(/[\p{L}\p{N}]+(?:['’‘ʼʻ\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return words ? Math.max(1, Math.ceil(words / 200)) : null;
}

function localizedReadingTime(row, locale) {
  const base = row.reading_content ?? row.content;
  const translated = locale === "id" ? base : row[`reading_content_${locale}`] ?? row[`content_${locale}`];
  return calculateReadingTime(typeof translated === "string" && translated.trim() ? translated : base);
}

module.exports = { calculateReadingTime, localizedReadingTime };
