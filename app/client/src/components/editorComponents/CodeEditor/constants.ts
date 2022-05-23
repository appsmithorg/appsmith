// For these error types, we want to show a warning
// All messages can be found here => https://github.com/jshint/jshint/blob/2.9.5/src/messages.js

export const WARNING_LINT_ERRORS = {
  W098: "'{a}' is defined but never used.",
  W014:
    "Misleading line break before '{a}'; readers may interpret this as an expression boundary.",
};

export const LINT_TOOLTIP_CLASS = "CodeMirror-lint-tooltip";

export const LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS = "CodeMirror-lint-tooltip-left";

export enum LintTooltipDirection {
  left = "left",
  right = "right",
}
