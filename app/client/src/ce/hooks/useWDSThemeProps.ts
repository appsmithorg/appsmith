import { useMemo } from "react";
import type { useTheme } from "@appsmith/wds-theming";
import type { ThemeSetting } from "constants/AppConstants";

export type WDSThemeProps = Parameters<typeof useTheme>[0];

/**
 * Builds the props that the WDS useTheme hook needs from the app theme setting.
 * The editor canvas, the app viewer and the custom widget builder preview use it.
 *
 * It is a hook, so an edition can read more state (for example with useSelector).
 * Call it at the top level of a component, like any other hook.
 * CE maps the five theme fields.
 */
export const useWDSThemeProps = (themeSetting: ThemeSetting): WDSThemeProps => {
  const { accentColor, borderRadius, colorMode, density, sizing } =
    themeSetting;

  return useMemo(
    () =>
      ({
        borderRadius,
        seedColor: accentColor,
        colorMode: colorMode.toLowerCase(),
        userSizing: sizing,
        userDensity: density,
      }) as WDSThemeProps,
    [accentColor, borderRadius, colorMode, density, sizing],
  );
};
