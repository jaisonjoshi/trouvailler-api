/**
 * Generates a lowercase, URL-safe, unique-style slug from a string.
 * @param {string} text
 * @returns {string}
 */
export function generateSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")           // Replace spaces with -
    .replace(/&/g, "-and-")          // Replace & with 'and'
    .replace(/[^\w\-]+/g, "")        // Remove all non-word chars except -
    .replace(/\-\-+/g, "-")          // Replace multiple - with single -
    .replace(/^-+/, "")              // Trim - from start of text
    .replace(/-+$/, "");             // Trim - from end of text
}
