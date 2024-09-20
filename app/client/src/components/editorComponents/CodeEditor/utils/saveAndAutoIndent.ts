import { getPlatformOS } from "utils/helpers";
import type CodeMirror from "codemirror";
import { autoIndentCode } from "./autoIndentUtils";
import { KEYBOARD_SHORTCUTS_BY_PLATFORM } from "./keyboardShortcutConstants";

export const getSaveAndAutoIndentKey = () => {
  const platformOS = getPlatformOS() || "default";

  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].saveAndAutoIndent;
};

export const saveAndAutoIndentCode = (editor: CodeMirror.Editor) => {
  autoIndentCode(editor);
  // We need to use a setTimeout here to postpone the refresh() to after CodeMirror/Browser has updated the layout according to the new content
  setTimeout(() => editor.refresh(), 0);
};
