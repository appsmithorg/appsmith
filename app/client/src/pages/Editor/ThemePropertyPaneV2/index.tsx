import styled from "styled-components";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import SettingSection from "./SettingSection";
import type { ThemeSetting } from "constants/AppConstants";
import ThemeColorControl from "./controls/ThemeColorControl";
import BetaCard from "components/editorComponents/BetaCard";
import ThemeSizingControl from "./controls/ThemeSizingControl";
import ThemeDensityControl from "./controls/ThemeDensityControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import { updateApplication } from "@appsmith/actions/applicationActions";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";
import { getAppThemeSettings } from "@appsmith/selectors/applicationSelectors";

const SubText = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1rem;
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
`;

function ThemePropetyPane() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const themeSettings = useSelector(getAppThemeSettings);

  const updateSelectedTheme = useCallback(
    (theme: ThemeSetting) => {
      // (TODO): Add analytics to track theming updates

      const payload: UpdateApplicationPayload = {
        currentApp: true,
      };

      payload.applicationDetail = {
        themeSetting: theme,
      };

      dispatch(updateApplication(applicationId, payload));
    },
    [updateApplication],
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
        <SettingSection className="px-4 py-3" isDefaultOpen title="Color">
          <section className="space-y-2">
            <ThemeColorControl
              theme={themeSettings}
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
              theme={themeSettings}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>

        {/* SPACING */}
        <SettingSection
          className="px-4 py-3 border-t"
          isDefaultOpen
          title="Spacing"
        >
          <section className="space-y-2">
            <SubText>Density</SubText>
            <ThemeDensityControl
              theme={themeSettings}
              updateTheme={updateSelectedTheme}
            />
          </section>
          <section className="space-y-2">
            <SubText>Sizing</SubText>
            <ThemeSizingControl
              theme={themeSettings}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>
      </main>
    </>
  );
}

export default ThemePropetyPane;
