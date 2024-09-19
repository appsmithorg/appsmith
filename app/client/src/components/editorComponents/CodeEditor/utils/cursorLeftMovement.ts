import { getPlatformOS } from "utils/helpers";
import { KEYBOARD_SHORTCUTS_BY_PLATFORM } from "./keyboardShortcutConstants";

export const getMoveCursorLeftKey = () => {
  const platformOS = getPlatformOS() || "default";

  return KEYBOARD_SHORTCUTS_BY_PLATFORM[platformOS].cursorLeftMovement;
};
