import { getPlatformOS, PLATFORM_OS } from "utils/helpers";

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
