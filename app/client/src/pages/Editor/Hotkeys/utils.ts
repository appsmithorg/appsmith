import { isMacOs } from "utils/AppsmithUtils";

export const displayHotkey = (hotkey: string) => {
  if (!hotkey) return;

  return hotkey
    .replace("meta", isMacOs() ? "⌘" : "ctrl")
    .replace("shift", "⇧")
    .replace("alt", "⌥")
    .replace("ctrl", "⌃");
};
