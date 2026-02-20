import getIsSafeURL from "utils/validation/getIsSafeURL";

const DEFAULT_ALLOWED_TAGS = new Set([
  // Text structure
  "p",
  "div",
  "span",
  "br",
  "hr",
  // Headings
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // Lists
  "ul",
  "ol",
  "li",
  // Formatting
  "strong",
  "em",
  "b",
  "i",
  "code",
  "pre",
  "blockquote",
  "kbd",
  "s",
  "del",
  "sup",
  "sub",
  // Tables (used by markdown-ish content)
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  // Links & media
  "a",
  "img",
  // GitHub release notes frequently contain <g-emoji> nodes
  "g-emoji",
  // Collapse/expand blocks
  "details",
  "summary",
]);

// These tags should be removed entirely, including their contents.
// Unwrapping them can leak text (e.g. `<script>alert(1)</script>` -> `alert(1)`).
const DROP_TAGS_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  // Defense-in-depth: avoid namespace/mutation-XSS footguns.
  "template",
  "svg",
  "math",
  "foreignobject",
]);

// These tags are never useful for our use-cases and are safest dropped.
const DROP_TAGS = new Set(["meta", "link", "base"]);

const DEFAULT_ALLOWED_ATTRS_BY_TAG: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  "g-emoji": new Set(["alias", "fallback-src", "src"]),
};

const ALLOWED_LINK_TARGETS = new Set(["_blank", "_self", "_parent", "_top"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type UrlContext = "href" | "src";

function isSafeUrl(value: string, context: UrlContext): boolean {
  const trimmed = value.trim();

  // Never allow data: links in <a href>. They can still be abused for phishing or
  // unexpected downloads, and aren't needed for release notes/tooltips.
  if (context === "href" && /^data:/i.test(trimmed)) return false;

  return trimmed.length > 0 && Boolean(getIsSafeURL(trimmed));
}

function ensureSafeRel(el: Element) {
  if (el.getAttribute("target") !== "_blank") return;

  const existing = (el.getAttribute("rel") || "")
    .split(/\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const relSet = new Set(existing);
  relSet.add("noopener");
  relSet.add("noreferrer");

  // Stable attribute value for easier testing/diffing.
  el.setAttribute("rel", Array.from(relSet).sort().join(" "));
}

function sanitizeElement(el: Element) {
  const tag = el.tagName.toLowerCase();

  // Remove dangerous/footgun tags completely.
  if (DROP_TAGS_WITH_CONTENT.has(tag) || DROP_TAGS.has(tag)) {
    el.parentNode?.removeChild(el);
    return;
  }

  // Remove disallowed tags but keep their children (after they've been sanitized).
  if (!DEFAULT_ALLOWED_TAGS.has(tag)) {
    const parent = el.parentNode;
    if (!parent) return;

    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
    return;
  }

  // Remove unsafe/unexpected attributes.
  const allowedAttrs = DEFAULT_ALLOWED_ATTRS_BY_TAG[tag] ?? new Set<string>();
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name === "style" || name.startsWith("on")) {
      el.removeAttribute(attr.name);
      continue;
    }

    if (!allowedAttrs.has(name)) {
      el.removeAttribute(attr.name);
      continue;
    }

    // Validate URL-bearing attributes.
    if (
      (tag === "a" && name === "href") ||
      (tag === "img" && name === "src") ||
      (tag === "g-emoji" && (name === "fallback-src" || name === "src"))
    ) {
      const context: UrlContext = tag === "a" ? "href" : "src";
      if (!isSafeUrl(value, context)) {
        el.removeAttribute(attr.name);
      }
    }

    // Only allow known-safe values for link targets.
    if (tag === "a" && name === "target") {
      const target = value.trim();
      if (!ALLOWED_LINK_TARGETS.has(target)) {
        el.removeAttribute(attr.name);
      }
    }
  }

  if (tag === "a") {
    ensureSafeRel(el);
  }
}

function sanitizeNode(node: Node) {
  // Remove HTML comments.
  if (node.nodeType === Node.COMMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  for (const child of Array.from(el.childNodes)) {
    sanitizeNode(child);
  }

  sanitizeElement(el);
}

/**
 * Minimal, dependency-free HTML sanitizer intended for rendering *trusted-ish* HTML
 * (like release notes, tooltips, and in-app messages) without exposing XSS risk.
 *
 * If DOM APIs aren't available (e.g. during SSR), this falls back to escaping.
 */
export default function sanitizeHtml(dirtyHtml: unknown): string {
  if (typeof dirtyHtml !== "string" || dirtyHtml.trim().length === 0) {
    return "";
  }

  if (typeof document === "undefined") {
    return escapeHtml(dirtyHtml);
  }

  const template = document.createElement("template");
  template.innerHTML = dirtyHtml;

  for (const child of Array.from(template.content.childNodes)) {
    sanitizeNode(child);
  }

  return template.innerHTML;
}
