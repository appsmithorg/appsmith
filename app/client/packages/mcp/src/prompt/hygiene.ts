// --- M7-T3 commit message hygiene [COUNCIL: security F4 + rev-2 condition 3] -------------------------------------

export const MCP_COMMIT_MESSAGE_MAX = 200;
// The server-side (MCP) marker prepended to every commit message at commit time. Non-strippable: messages that
// begin with "[" are rejected, so agent text can never impersonate or absorb the marker.
export const MCP_COMMIT_MARKER = "[mcp] ";
// safeText rules (matching schema.ts's RAW_EXPRESSION, same escaped-code-point style): no binding/template
// syntax and no U+2028/U+2029 line separators.
const COMMIT_TEMPLATE_SYNTAX =
  /\u007b\u007b|\u007d\u007d|\$\u007b|`|\u2028|\u2029/;

// Explicit code-point scan (kept regex-free so no control characters — literal or escaped — live in a pattern):
// - C0 controls U+0000-U+001F (a multiline message falls here via \n) and DEL U+007F: the message must be ONE
//   printable line;
// - Unicode bidi/format controls U+202A-U+202E (embeddings/overrides) and U+2066-U+2069 (isolates): rejected so
//   agent text cannot visually reorder the load-bearing facts in git UIs or the approval prompt
//   [SECURITY REV-2 CONDITION 3].
function commitCharProblem(message: string): string | undefined {
  for (const char of message) {
    const code = char.codePointAt(0) ?? 0;

    if (code <= 0x1f || code === 0x7f) {
      return "the commit message must be a single line of printable characters (no control characters)";
    }

    if (
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    ) {
      return "the commit message must not contain Unicode bidirectional/format control characters";
    }
  }

  return undefined;
}

// Returns a human-readable problem for an invalid commit message, or undefined when it passes every rule.
export function commitMessageProblem(message: string): string | undefined {
  if (message.length === 0) return "the commit message must not be empty";

  if (message.length > MCP_COMMIT_MESSAGE_MAX) {
    return `the commit message must be at most ${MCP_COMMIT_MESSAGE_MAX} characters`;
  }

  if (message.startsWith("[")) {
    return `the commit message must not start with "[" (the server prepends a non-strippable "${MCP_COMMIT_MARKER.trim()} " marker)`;
  }

  const charProblem = commitCharProblem(message);

  if (charProblem !== undefined) return charProblem;

  if (COMMIT_TEMPLATE_SYNTAX.test(message)) {
    return "the commit message must not contain binding/template syntax ({{ }}, ${ }, or backticks) or line separators";
  }

  return undefined;
}

export function truncateForPrompt(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Everything interpolated into a human-facing approval prompt passes through here: C0 controls/DEL and bidi/format
// controls are stripped (an app can be RENAMED outside MCP with hostile characters — the commit message is already
// hygiene-rejected, but names/branches are not under our control) and double quotes are replaced so interpolated
// text cannot visually escape its quoted position in the prompt (M7 security code review, concerns 2–3).
export function promptSafe(text: string): string {
  let cleaned = "";

  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;

    if (code <= 0x1f || code === 0x7f) continue;

    if (
      (code >= 0x202a && code <= 0x202e) ||
      (code >= 0x2066 && code <= 0x2069)
    )
      continue;

    cleaned += ch === '"' ? "'" : ch;
  }

  return cleaned;
}
