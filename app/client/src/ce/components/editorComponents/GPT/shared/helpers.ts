import type { CodeBlockPart } from "./types";

/**
 * Mapping from editor mode strings to human-readable labels.
 * Includes both SQL and JSON/NoSQL mode identifiers.
 */
const MODE_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  "text/x-sql": "SQL",
  sql: "SQL",
  "text/x-pgsql": "PostgreSQL",
  "text/x-mysql": "MySQL",
  graphql: "GraphQL",
  json: "JSON",
  "application/json": "JSON",
};

/**
 * Mapping from editor mode strings to language identifiers used in code blocks.
 */
export const CODE_LANGUAGES: Record<string, string> = {
  javascript: "javascript",
  "text/x-sql": "sql",
  sql: "sql",
  "text/x-pgsql": "sql",
  "text/x-mysql": "sql",
  graphql: "graphql",
  "application/json": "json",
  json: "json",
};

export function getModeLabel(mode: string | undefined): string {
  if (!mode) return "Code";

  return MODE_LABELS[mode] || mode;
}

/**
 * Parse a markdown-style string into an array of text and fenced-code parts.
 */
export function extractCodeBlocks(
  text: string,
  defaultLanguage: string = "javascript",
): CodeBlockPart[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: CodeBlockPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index).trim();

      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    parts.push({
      type: "code",
      content: match[2].trim(),
      language: match[1] || defaultLanguage,
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex).trim();

    if (textContent) {
      parts.push({ type: "text", content: textContent });
    }
  }

  if (parts.length === 0 && text.trim()) {
    parts.push({ type: "text", content: text.trim() });
  }

  return parts;
}
