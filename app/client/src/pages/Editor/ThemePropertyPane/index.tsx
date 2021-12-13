import React, { useMemo } from "react";
import * as Sentry from "@sentry/react";
import { last } from "lodash";

import ThemeEditor from "./ThemeEditor";
import ThemeSelector from "./ThemeSelector";
import {
  AppThemingMode,
  getAppThemingStack,
} from "selectors/appThemingSelectors";
import { useSelector } from "react-redux";
import { getCurrentApplicationId } from "selectors/editorSelectors";

export function ThemePropertyPane() {
  const themingStack = useSelector(getAppThemingStack);
  const applicationId = useSelector(getCurrentApplicationId);
  const themingMode = last(themingStack);

  /**
   * renders the theming property pane:
   *
   * 1. if THEME_EDIT -> ThemeEditor
   * 2. if THEME_SELECTION -> ThemeSelector
   */
  const propertyPane = useMemo(() => {
    switch (true) {
      case themingMode === AppThemingMode.APP_THEME_EDIT:
        return <ThemeEditor />;
      case themingMode === AppThemingMode.APP_THEME_SELECTION:
        return <ThemeSelector />;
      default:
        return <ThemeEditor />;
    }
  }, [themingMode]);

  return <div className="relative py-3 space-y-4">{propertyPane}</div>;
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
