import React, { useMemo } from "react";
import * as Sentry from "@sentry/react";

import ThemeEditor from "./ThemeEditor";
import ThemeSelector from "./ThemeSelector";
import { getThemingMode, ThemingMode } from "selectors/themingSelectors";
import { useSelector } from "react-redux";

export function ThemePropertyPane() {
  const themingMode = useSelector(getThemingMode);

  /**
   * renders the theming property pane:
   *
   * 1. if THEME_EDIT -> ThemeEditor
   * 2. if THEME_SELECTIOn -> ThemeSelector
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case themingMode === ThemingMode.THEME_EDIT:
        return <ThemeEditor />;
      case themingMode === ThemingMode.THEME_SELECTION:
        return <ThemeSelector />;
      default:
        return <ThemeEditor />;
    }
  }, [themingMode]);

  return <div className="relative py-3 space-y-4">{propertyPane}</div>;
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
