/**
 * Plain-text extraction for HTML table cells (export, and mirrored in derived.js
 * for search/filter/sort — derived.js cannot import this module).
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

  // Plain-text fast path: skip DOMParser when there are no tags.
  if (!/<[^>]*>/.test(value)) {
    return value;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    const text = (doc.body && doc.body.textContent) || "";

    if (text.trim()) {
      return text;
    }

    return stripHtmlTags(value);
  } catch {
    return stripHtmlTags(value);
  }
};
