/**
 * Plain-text extraction for HTML table cells on export.
 *
 * Uses tag-stripping (not DOMParser textContent) so results match the
 * linkedom worker path in derived.js used for search/filter/sort.
 */

export const stripHtmlTags = (value: string): string => {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const getTextFromHTML = (html: unknown): string => {
  if (html == null || html === "") {
    return "";
  }

  let value: unknown = html;

  if (typeof value === "object") {
    value = JSON.stringify(value);
  }

  if (typeof value !== "string") {
    return String(value);
  }

  // Plain-text fast path when there are no tags.
  if (!/<[^>]*>/.test(value)) {
    return value;
  }

  return stripHtmlTags(value);
};
