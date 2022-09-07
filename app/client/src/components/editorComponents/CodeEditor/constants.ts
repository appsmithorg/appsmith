import { Position } from "codemirror";

// For these error types, we want to show a warning
// All messages can be found here => https://github.com/jshint/jshint/blob/2.9.5/src/messages.js
export const WARNING_LINT_ERRORS = {
  W098: "'{a}' is defined but never used.",
  W014:
    "Misleading line break before '{a}'; readers may interpret this as an expression boundary.",
};

/** These errors should be overlooked
 * E041 => Unrecoverable syntax error.
 * W032 => Unnecessary semicolon.
 */
export const IGNORED_LINT_ERRORS = ["E041", "W032"];

// https://github.com/jshint/jshint/blob/d3d84ae1695359aef077ddb143f4be98001343b4/src/messages.js#L204
export const IDENTIFIER_NOT_DEFINED_LINT_ERROR_CODE = "W117";

// Refined error messages
export const REFINED_LINT_ERROR_MESSAGES: Record<string, string> = {
  "'await' is not defined.":
    "'await' expressions are only allowed within async functions. Did you mean to mark this function as 'async'?",
};

export const LINT_TOOLTIP_CLASS = "CodeMirror-lint-tooltip";
export const LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS = "CodeMirror-lint-tooltip-left";
export enum LintTooltipDirection {
  left = "left",
  right = "right",
}
export const JS_OBJECT_START_STATEMENT = "export default";
export const INVALID_JSOBJECT_START_STATEMENT = `JSObject must start with '${JS_OBJECT_START_STATEMENT}'`;
export const CODE_EDITOR_START_POSITION: Position = { line: 0, ch: 0 };
export const VALID_JS_OBJECT_BINDING_POSITION: Position = {
  line: 0,
  ch: JS_OBJECT_START_STATEMENT.length,
};
export const SUPPORTED_WEB_APIS = {
  console: true,
  crypto: true,
};
