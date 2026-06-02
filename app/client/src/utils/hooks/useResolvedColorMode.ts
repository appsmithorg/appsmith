import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ResolvedColorMode } from "constants/darkModeColors";
import {
  getDarkModeSetting,
  getResolvedColorMode,
} from "selectors/darkModeSelectors";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { setResolvedColorModeAction } from "ee/actions/applicationActions";
import { getDarkModePreference } from "utils/storage";
import {
  DARK_MEDIA_QUERY,
  getOsColorMode,
  resolveColorMode,
} from "utils/colorModeResolution";

/**
 * Resolves the color mode to apply in the published app, in priority order:
 *   1. The live end-user toggle (Redux `resolvedColorMode`).
 *   2. The end user's persisted per-app preference (only if the developer
 *      allows switching).
 *   3. The developer default — `AUTO` follows the OS `prefers-color-scheme`,
 *      otherwise the explicit `LIGHT`/`DARK`.
 *
 * Single source of truth for both the viewer ({@link AppViewer}) and the
 * end-user {@link DarkModeToggle}.
 */
export const useResolvedColorMode = (): ResolvedColorMode => {
  const dispatch = useDispatch();
  const darkModeSetting = useSelector(getDarkModeSetting);
  const liveMode = useSelector(getResolvedColorMode);
  const appId = useSelector(getCurrentApplicationId);
  const { allowEndUserSwitch, defaultMode } = darkModeSetting;

  // Track OS preference so AUTO mode reacts to system theme changes live.
  const [osMode, setOsMode] = useState<ResolvedColorMode>(getOsColorMode);

  // On mount (or when the app/permission changes), seed the live mode from the
  // persisted per-app preference when end-user switching is allowed.
  useEffect(
    function seedFromStoredPreference() {
      if (!appId || !allowEndUserSwitch) return;

      let cancelled = false;

      getDarkModePreference(appId).then((stored) => {
        if (!cancelled && stored) {
          dispatch(setResolvedColorModeAction(appId, stored));
        }
      });

      return () => {
        cancelled = true;
      };
    },
    [appId, allowEndUserSwitch, dispatch],
  );

  // Keep OS preference in sync for AUTO mode.
  useEffect(function subscribeToOsPreference() {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mql = window.matchMedia(DARK_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setOsMode(event.matches ? "DARK" : "LIGHT");
    };

    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Live choice only wins when it belongs to THIS app — guards against a choice
  // made in another app leaking through the shared Redux state.
  return resolveColorMode({
    appId,
    liveMode,
    allowEndUserSwitch,
    defaultMode,
    osMode,
  });
};
