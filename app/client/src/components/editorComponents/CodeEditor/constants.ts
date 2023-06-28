import { JS_OBJECT_START_STATEMENT } from "plugins/Linting/constants";
import type { Position } from "codemirror";

export const LINT_TOOLTIP_CLASS = "CodeMirror-lint-tooltip";
export const LINT_TOOLTIP_JUSTIFIED_LEFT_CLASS = "CodeMirror-lint-tooltip-left";
export enum LintTooltipDirection {
  left = "left",
  right = "right",
}
export const CODE_EDITOR_START_POSITION: Position = { line: 0, ch: 0 };
export const VALID_JS_OBJECT_BINDING_POSITION: Position = {
  line: 0,
  ch: JS_OBJECT_START_STATEMENT.length,
};
