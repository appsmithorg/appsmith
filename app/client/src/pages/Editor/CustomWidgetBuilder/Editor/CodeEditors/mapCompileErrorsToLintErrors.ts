import { Severity } from "entities/AppsmithConsole";
import type { LintError } from "utils/DynamicBindingUtils";
import { PropertyEvaluationErrorType } from "utils/DynamicBindingUtils";
import { isUndefined } from "lodash";
import { LINT_BINDING_LITERAL_MATCH_ERROR_CODE } from "plugins/Linting/constants";
import type { DebuggerLog, DebuggerLogItem } from "../../types";
import { DebuggerLogType } from "../../types";

/**
 * Prefix length used for originalBinding / errorSegment / raw when mapping
 * Babel compile errors into CodeMirror lint annotations.
 *
 * The shared lint helper turns originalBinding into a RegExp and searches the
 * editor value for it. Passing the entire custom-widget JS source (often tens
 * of KB) causes a stack overflow in getKeyPositionInString and crashes the
 * builder. A short prefix keeps that search cheap while still matching at the
 * document start for typical module sources (e.g. `import ...`), so existing
 * Babel line/column offset math continues to place the underline correctly.
 *
 * Tradeoff: if this prefix somehow appears again later in the file, multiple
 * underline positions could be returned. That is rare for module headers; 128
 * chars stays far below the ~25KB crash threshold.
 */
export const LINT_BINDING_PREFIX_LENGTH = 128;

export interface LintBindingPrefix {
  value: string;
  /** When true, getLintAnnotations uses indexOf instead of \b-anchored regex. */
  useLiteralMatch: boolean;
}

export function getLintBindingPrefix(js: string): LintBindingPrefix {
  if (!js) {
    return { value: " ", useLiteralMatch: false };
  }

  let prefix = js.slice(0, LINT_BINDING_PREFIX_LENGTH);
  let useLiteralMatch = false;

  /*
   * buildBoundaryRegex wraps each word in \b...\b. If we truncate mid-word, the
   * trailing \b no longer matches at index 0 (the next character is still a word
   * char), getKeyPositionInString returns no positions, and underlines disappear.
   * Trim back to a non-word boundary when the source continues with a word char.
   * If the whole prefix is one word (nothing to trim), keep the bounded slice and
   * opt into literal (indexOf) matching instead of restoring a mid-word \b prefix.
   */
  if (
    js.length > LINT_BINDING_PREFIX_LENGTH &&
    /\w$/.test(prefix) &&
    /\w/.test(js.charAt(LINT_BINDING_PREFIX_LENGTH))
  ) {
    const trimmed = prefix.replace(/\w+$/, "");

    if (trimmed.length > 0) {
      prefix = trimmed;
    } else {
      useLiteralMatch = true;
    }
  }

  return { value: prefix, useLiteralMatch };
}

export function mapCompileErrorsToLintErrors(
  debuggerLogs: DebuggerLog[] | undefined,
  js: string,
): LintError[] {
  if (!debuggerLogs) {
    return [];
  }

  const { useLiteralMatch, value: bindingPrefix } = getLintBindingPrefix(js);

  return debuggerLogs
    .filter((d) => d.type === DebuggerLogType.ERROR)
    .map((d) => d.args)
    .flat()
    .filter(
      (d: DebuggerLogItem) => !isUndefined(d.line) && !isUndefined(d.column),
    )
    .map((d: DebuggerLogItem) => ({
      errorType: PropertyEvaluationErrorType.LINT,
      raw: bindingPrefix,
      severity: Severity.ERROR,
      errorMessage: {
        name: "LintingError",
        message: d.message as string,
      },
      errorSegment: bindingPrefix,
      originalBinding: bindingPrefix,
      variables: [],
      code: useLiteralMatch ? LINT_BINDING_LITERAL_MATCH_ERROR_CODE : "",
      line: d.line ? d.line - 1 : 1,
      ch: d.column ? d.column + 2 : 1,
    }));
}
