import { getPlatformOS, PLATFORM_OS } from "utils/helpers";
import type CodeMirror from "codemirror";
import { autoIndentCode } from "./autoIndentUtils";

const saveAndAutoIndentShortcut = {
  [PLATFORM_OS.MAC]: "Cmd-S",
  [PLATFORM_OS.IOS]: "Cmd-S",
  [PLATFORM_OS.WINDOWS]: "Ctrl-S",
  [PLATFORM_OS.ANDROID]: "Ctrl-S",
  [PLATFORM_OS.LINUX]: "Ctrl-S",
};

export const getSaveAndAutoIndentKey = () => {
  const platformOS = getPlatformOS();
  return platformOS ? saveAndAutoIndentShortcut[platformOS] : "Ctrl-S";
};

export const saveAndAutoIndentCode = (editor: CodeMirror.Editor) => {
  autoIndentCode(editor);
  // We need to use a setTimeout here to postpone the refresh() to after CodeMirror/Browser has updated the layout according to the new content
  setTimeout(() => editor.refresh(), 0);
};
