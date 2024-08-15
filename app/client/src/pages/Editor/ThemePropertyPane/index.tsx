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
import BetaCard from "components/editorComponents/BetaCard";
import { SectionTitle } from "../AppSettingsPane/AppSettings";
import { THEME_SETTINGS_SECTION_CONTENT_HEADER } from "ee/constants/messages";

export function ThemePropertyPane() {
  const themingStack = useSelector(getAppThemingStack);
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

  return (
    <>
      <SectionTitle className="flex items-center gap-2 px-2">
        {THEME_SETTINGS_SECTION_CONTENT_HEADER()}
        <BetaCard />
      </SectionTitle>
      <div className="relative">{propertyPane}</div>
    </>
  );
}

ThemePropertyPane.displayName = "ThemePropertyPane";

export default Sentry.withProfiler(ThemePropertyPane);
