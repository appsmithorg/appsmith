import { getPlatformOS, PLATFORM_OS } from "utils/helpers";
import CodeMirror from "codemirror";
import { isNil } from "lodash";

const autoIndentShortcut = {
  [PLATFORM_OS.MAC]: "Shift-Cmd-P",
  [PLATFORM_OS.IOS]: "Shift-Cmd-P",
  [PLATFORM_OS.WINDOWS]: "Shift-Alt-F",
  [PLATFORM_OS.ANDROID]: "Shift-Alt-F",
  [PLATFORM_OS.LINUX]: "Shift-Ctrl-I",
};

const autoIndentShortcutText = {
  [PLATFORM_OS.MAC]: "Shift + Cmd + P",
  [PLATFORM_OS.IOS]: "Shift + Cmd + P",
  [PLATFORM_OS.WINDOWS]: "Shift + Alt + F",
  [PLATFORM_OS.ANDROID]: "Shift + Alt + F",
  [PLATFORM_OS.LINUX]: "Shift + Ctrl + I",
};

export const getAutoIndentShortcutKey = () => {
  const platformOS = getPlatformOS();
  return platformOS ? autoIndentShortcut[platformOS] : "Shift-Alt-F";
};

export const getAutoIndentShortcutKeyText = () => {
  const platformOS = getPlatformOS();
  return platformOS ? autoIndentShortcutText[platformOS] : "Shift + Alt + F";
};

export const autoIndentCode = (editor: CodeMirror.Editor) => {
  editor.eachLine((line: any) => {
    const lineNumber = editor.getLineNumber(line);
    if (!isNil(lineNumber)) {
      editor.indentLine(lineNumber, "smart");
    }
  });
  // We need to use a setTimeout here to postpone the refresh() to after CodeMirror/Browser has updated the layout according to the new content
  setTimeout(() => editor.refresh(), 0);
};
