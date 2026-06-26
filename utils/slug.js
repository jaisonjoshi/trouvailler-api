/**
 * Generates a lowercase, URL-safe, unique-style slug from a string.
 * @param {string} text
 * @returns {string}
 */
export function generateSlug(text) {
  if (!text) {
    return "";
  }
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
