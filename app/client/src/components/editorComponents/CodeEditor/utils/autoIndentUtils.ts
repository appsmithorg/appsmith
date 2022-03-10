import { PLATFORM_OS, getPlatformOS } from "utils/helpers";

const autoIndentShortcut = {
  [PLATFORM_OS.MAC]: "Shift-Option-F",
  [PLATFORM_OS.IOS]: "Shift-Option-F",
  [PLATFORM_OS.WINDOWS]: "Shift-Alt-F",
  [PLATFORM_OS.ANDROID]: "Shift-Alt-F",
  [PLATFORM_OS.LINUX]: "Ctrl-Shift-I",
};

export const getAutoIndentShortcutKey = () => {
  const platformOS = getPlatformOS();
  const autoIndentKey = platformOS
    ? autoIndentShortcut[platformOS]
    : "Shift-Alt-F";
  return autoIndentKey;
};
