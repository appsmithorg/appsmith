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
 */
export function renderKeywordHint(element: HTMLElement, label: string): void {
  element.setAttribute("keyword", label);
  element.textContent = label;
}
