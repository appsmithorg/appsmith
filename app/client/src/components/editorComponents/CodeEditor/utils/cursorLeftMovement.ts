import { getPlatformOS, PLATFORM_OS } from "utils/helpers";

const moveCursorLeftShortcut = {
  [PLATFORM_OS.MAC]: "Cmd-Left",
  [PLATFORM_OS.IOS]: "Cmd-Left",
  [PLATFORM_OS.WINDOWS]: "Home",
  [PLATFORM_OS.ANDROID]: "Home",
  [PLATFORM_OS.LINUX]: "Home",
};

export const getMoveCursorLeftKey = () => {
  const platformOS = getPlatformOS();
  return platformOS ? moveCursorLeftShortcut[platformOS] : "Home";
};
