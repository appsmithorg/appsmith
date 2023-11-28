import styled, { createGlobalStyle } from "styled-components";
import { get, startCase } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback, useState } from "react";

import {
  AppThemingMode,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import {
  setAppThemingModeStackAction,
  updateSelectedAppThemeAction,
} from "actions/appThemingActions";
import SettingSection from "./SettingSection";
import type { AppTheme } from "entities/AppTheming";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ThemeColorControl from "./controls/ThemeColorControl";
import { Classes as CsClasses } from "design-system-old";
import {
  getCurrentApplication,
  getCurrentApplicationId,
} from "selectors/editorSelectors";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import BetaCard from "components/editorComponents/BetaCard";
import ThemeSpacingControl from "./controls/ThemeSpacingControl";
import { updateApplication } from "@appsmith/actions/applicationActions";

const THEMING_BETA_CARD_POPOVER_CLASSNAME = `theming-beta-card-popover`;

const SubText = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1rem;
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
`;

const PopoverStyles = createGlobalStyle`
.${THEMING_BETA_CARD_POPOVER_CLASSNAME} .bp3-popover-content {
  padding: 10px 12px;
  border-radius: 0px;
  background-color: #FFF !important;
  color:   #090707 !important;
  box-shadow: none !important;
}

.${THEMING_BETA_CARD_POPOVER_CLASSNAME} .${CsClasses.BP3_POPOVER_ARROW_BORDER},
.${THEMING_BETA_CARD_POPOVER_CLASSNAME} .${CsClasses.BP3_POPOVER_ARROW_FILL} {
  fill: #FFF !important;
  stroke: #FFF !important;
  box-shadow: 0px 0px 2px rgb(0 0 0 / 20%), 0px 2px 10px rgb(0 0 0 / 10%);
}
`;

function ThemeEditor() {
  const dispatch = useDispatch();
  const application = useSelector(getCurrentApplication);
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * customizes the current theme
   */
  const updateSelectedTheme = useCallback(
    (theme: AppTheme) => {
      AnalyticsUtil.logEvent("APP_THEMING_CUSTOMIZE_THEME", {
        themeId: theme.id,
        themeName: theme.name,
      });

      const payload = {
        ...application,
        applicationDetails: {
          ...application.applicationDetails,
          themeSetting: {
            ...theme,
          },
        },
      };

      dispatch(updateApplication(applicationId, payload));
    },
    [updateSelectedAppThemeAction],
  );

  return (
    <>
      <header className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SubText>Theme properties</SubText>
            <BetaCard />
          </div>
        </div>
      </header>
      <main className="mt-1">
        {/* COLORS */}
        <SettingSection
          className="px-4 py-3 border-t"
          isDefaultOpen
          title="Color"
        >
          <section className="space-y-2">
            <ThemeColorControl
              theme={selectedTheme}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>

        {/* BORDER RADIUS */}
        <SettingSection
          className="px-4 py-3 border-t "
          isDefaultOpen
          title="Border"
        >
          <section className="space-y-2">
            <SubText>Border Radius</SubText>
            <ThemeBorderRadiusControl
              theme={selectedTheme}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>

        {/* SPACING */}
        <SettingSection
          className="px-4 py-3 border-t"
          isDefaultOpen
          title="Color"
        >
          <section className="space-y-2">
            <ThemeSpacingControl
              theme={selectedTheme}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>
      </main>
      <PopoverStyles />
    </>
  );
}

export default ThemeEditor;
