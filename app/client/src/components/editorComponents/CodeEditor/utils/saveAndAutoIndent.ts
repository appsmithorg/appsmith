import { getPlatformOS, PLATFORM_OS } from "utils/helpers";

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
