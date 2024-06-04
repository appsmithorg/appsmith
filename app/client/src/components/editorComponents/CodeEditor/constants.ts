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

export const CodeEditorColors = {
  KEYWORD: "#304eaa",
  FOLD_MARKER: "#442334",
  STRING: "#1659df",
  OPERATOR: "#009595",
  NUMBER: "#555",
  COMMENT: "var(--ads-v2-color-gray-400)",
  FUNCTION_ARGS: "hsl(288, 44%, 44%)",
  TOOLTIP_FN_ARGS: "#DB6E33",
  PROPERTY: "hsl(21, 70%, 53%)",
};

// For now we want to enable this functionality only for table and json widget for data property
// In future we can modify this object for other widgets and props too
export const SlashCommandMenuOnFocusWidgetProps: { [key: string]: string[] } = {
  TABLE_WIDGET_V2: ["tableData"],
  JSON_FORM_WIDGET: ["sourceData"],
};

export const CURSOR_CLASS_NAME = "CodeMirror-cursor";
