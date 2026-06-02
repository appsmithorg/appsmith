import type {
  DarkModeDefault,
  ResolvedColorMode,
} from "constants/darkModeColors";

/**
 * The live end-user color choice, tagged with the app it was made in, so a
 * choice in one app can never leak into another app rendered by the same SPA.
 */
export interface LiveColorMode {
  appId: string;
  mode: ResolvedColorMode;
}

export const DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** The OS-level color preference (LIGHT outside the browser / when unsupported). */
export const getOsColorMode = (): ResolvedColorMode => {
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(DARK_MEDIA_QUERY).matches
  ) {
    return "DARK";
  }

  return "LIGHT";
};

/**
 * Pure resolution of the effective color mode for a published app, in order:
 *   1. The live end-user toggle — but only when switching is allowed AND the
 *      stored choice belongs to the current app.
 *   2. The developer default — `AUTO` follows the OS preference, otherwise the
 *      explicit `LIGHT`/`DARK`.
 *
 * Kept pure (no React/Redux) so the precedence rules can be unit-tested.
 */
export const resolveColorMode = (params: {
  appId?: string;
  liveMode: LiveColorMode | null;
  allowEndUserSwitch: boolean;
  defaultMode: DarkModeDefault;
  osMode: ResolvedColorMode;
}): ResolvedColorMode => {
  const { allowEndUserSwitch, appId, defaultMode, liveMode, osMode } = params;

  if (allowEndUserSwitch && liveMode && liveMode.appId === appId) {
    return liveMode.mode;
  }

  if (defaultMode === "AUTO") {
    return osMode;
  }

  return defaultMode;
};
