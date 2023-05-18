import { PLATFORM_OS } from "../../../../utils/helpers";

export const KEYBOARD_SHORTCUTS_BY_PLATFORM = {
  [PLATFORM_OS.MAC]: {
    saveAndAutoIndent: "Cmd-S",
    cursorLeftMovement: "Cmd-Left",
    autoIndentShortcut: "Shift-Cmd-P",
    autoIndentShortcutText: "Shift + Cmd + P",
    codeComment: "Cmd-/",
  },
  [PLATFORM_OS.IOS]: {
    saveAndAutoIndent: "Cmd-S",
    cursorLeftMovement: "Cmd-Left",
    autoIndentShortcut: "Shift-Cmd-P",
    autoIndentShortcutText: "Shift + Cmd + P",
    codeComment: "Cmd-/",
  },
  [PLATFORM_OS.WINDOWS]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/",
  },
  [PLATFORM_OS.ANDROID]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/",
  },
  [PLATFORM_OS.LINUX]: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Ctrl-I",
    autoIndentShortcutText: "Shift + Ctrl + I",
    codeComment: "Ctrl-/",
  },
  default: {
    saveAndAutoIndent: "Ctrl-S",
    cursorLeftMovement: "Home",
    autoIndentShortcut: "Shift-Alt-F",
    autoIndentShortcutText: "Shift + Alt + F",
    codeComment: "Ctrl-/",
  },
};
