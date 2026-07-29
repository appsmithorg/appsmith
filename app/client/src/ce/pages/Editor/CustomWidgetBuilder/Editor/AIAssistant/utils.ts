import type { SrcDoc } from "pages/Editor/CustomWidgetBuilder/types";

/**
 * The editor mode sent to the AI assistant backend. The server resolves a
 * reference document for known modes and safely ignores unknown ones, so this
 * doubles as a hook for adding a bundled `custom_widget-reference.md` later.
 */
export const CUSTOM_WIDGET_AI_MODE = "custom_widget";

export interface WidgetCodeUpdates {
  html?: string;
  css?: string;
  js?: string;
}

type SrcDocFile = keyof WidgetCodeUpdates;

const LANGUAGE_TO_FILE: Record<string, SrcDocFile> = {
  html: "html",
  css: "css",
  js: "js",
  javascript: "js",
};

const FENCED_CODE_BLOCK_REGEX =
  /^[ \t]*```[ \t]*(\w+)?[^\n]*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm;

const breakMarkdownFence = (code: string) => code.replace(/```/g, "`\u200b``");

/**
 * Builds the context string sent alongside every prompt. It carries the
 * custom widget programming model, the response contract the assistant must
 * follow, and the current contents of all three files.
 *
 * Note: this string is embedded inside a fenced block by the server, so it
 * must not contain triple backticks itself.
 */
export function buildWidgetAIContext(srcDoc?: SrcDoc): string {
  return [
    "You are an expert Appsmith custom widget developer. A custom widget is built from three files: HTML (body markup only), CSS, and JavaScript.",
    "The widget runs in a sandboxed iframe that exposes a global `appsmith` object:",
    "- appsmith.onReady(fn) — required entry point; initialize and render the widget inside it.",
    "- appsmith.model — data passed from the host app; appsmith.onModelChange(fn) subscribes to changes.",
    "- appsmith.updateModel(obj) — merges values back into the model.",
    "- appsmith.triggerEvent(name, contextObj) — fires an event configured on the widget.",
    "- appsmith.theme / appsmith.onThemeChange(fn) — app theme (primaryColor, backgroundColor, borderRadius, fontFamily).",
    "External libraries may be loaded with script or link CDN tags in the HTML file.",
    "",
    "RESPONSE FORMAT — follow strictly:",
    "1. When asked to create or change the widget, reply with a short explanation followed by the COMPLETE updated contents of every file you changed. Put each file in its own fenced markdown code block (three backticks) tagged exactly html, css or js. Each block replaces that whole file, so never return fragments or diffs, and use each tag at most once per reply.",
    "2. Only include a code block for a file you changed.",
    "3. When answering questions without changing the widget, never tag illustrative snippets with html, css or js — use untagged fenced blocks instead.",
    "",
    "CURRENT WIDGET CODE",
    "----- HTML -----",
    srcDoc?.html ? breakMarkdownFence(srcDoc.html) : "(empty)",
    "----- CSS -----",
    srcDoc?.css ? breakMarkdownFence(srcDoc.css) : "(empty)",
    "----- JAVASCRIPT -----",
    srcDoc?.js ? breakMarkdownFence(srcDoc.js) : "(empty)",
  ].join("\n");
}

/**
 * Extracts full-file updates from an assistant reply. Only fenced blocks
 * tagged html/css/js (or javascript) count as file updates, per the response
 * contract in {@link buildWidgetAIContext}. If a tag appears more than once,
 * the last block wins.
 */
export function extractCodeUpdates(content: string): WidgetCodeUpdates {
  const updates: WidgetCodeUpdates = {};

  if (!content) return updates;

  for (const match of content.matchAll(FENCED_CODE_BLOCK_REGEX)) {
    const file = LANGUAGE_TO_FILE[(match[1] || "").toLowerCase()];

    if (file && match[2].trim()) {
      updates[file] = match[2].replace(/\n$/, "");
    }
  }

  return updates;
}

/**
 * Returns the assistant reply with applied file-update blocks removed, so the
 * chat shows the explanation while the code lands in the editors.
 */
export function stripCodeUpdates(content: string): string {
  if (!content) return "";

  return content
    .replace(FENCED_CODE_BLOCK_REGEX, (block, language) =>
      LANGUAGE_TO_FILE[(language || "").toLowerCase()] ? "" : block,
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
