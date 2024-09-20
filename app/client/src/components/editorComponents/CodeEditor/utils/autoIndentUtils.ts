import { getPlatformOS } from "utils/helpers";
import type CodeMirror from "codemirror";
import { isNil } from "lodash";
import { KEYBOARD_SHORTCUTS_BY_PLATFORM } from "./keyboardShortcutConstants";

export const getAutoIndentShortcutKey = () => {
  const platformOS = getPlatformOS() || "default";

  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].autoIndentShortcut;
};

export const getAutoIndentShortcutKeyText = () => {
  const platformOS = getPlatformOS() || "default";

  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].autoIndentShortcutText;
};

export const autoIndentCode = (editor: CodeMirror.Editor) => {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor.eachLine((line: any) => {
    const lineNumber = editor.getLineNumber(line);

    if (!isNil(lineNumber)) {
      editor.indentLine(lineNumber, "smart");
    }
  });
  // We need to use a setTimeout here to postpone the refresh() to after CodeMirror/Browser has updated the layout according to the new content
  setTimeout(() => editor.refresh(), 0);
};
