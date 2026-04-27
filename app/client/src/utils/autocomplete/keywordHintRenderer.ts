/**
 * Renders a keyword/snippet label into a CodeMirror hint `<li>` in a way
 * that is safe against HTML injection.
 *
 * All autocomplete renderers that write untrusted (or potentially
 * untrusted) strings into the hint DOM must go through this helper
 * instead of assigning `innerHTML`. The consolidation also replaces the
 * 14 duplicate inline renderers that previously existed in
 * `CodemirrorTernService.ts` and `keywordCompletion.ts`, which all
 * repeated `element.setAttribute("keyword", …); element.innerHTML = …`.
 *
 * See GHSA-vjfq-fvfc-3vjw: the SQL hint renderer used the same sink
 * pattern against database-sourced identifiers and was exploited for
 * stored XSS. The keyword autocomplete renderers are not independently
 * exploitable today (the label is gated by a JS-keyword switch), but
 * normalising them to `textContent` eliminates the pattern from the
 * autocomplete subsystem.
 *
 * @param element The `<li>` element produced by CodeMirror's hint addon.
 * @param label   The primary text shown inside the entry (e.g. "for").
 * @param description Optional human-readable tag rendered next to the
 *   entry via the CSS rule `.CodeMirror-Tern-completion-keyword[keyword]:after
 *   { content: attr(keyword); }`. Defaults to `label`.
 */
export function renderKeywordHint(
  element: HTMLElement,
  label: string,
  description?: string,
): void {
  element.setAttribute("keyword", description ?? label);
  element.textContent = label;
}
