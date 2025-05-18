import styled, { createGlobalStyle } from "styled-components";
import { get, startCase } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback } from "react";

import { ThemeCard } from "./ThemeCard";
import {
  AppThemingMode,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import {
  resetThemeAction,
  setAppThemingModeStackAction,
  updateSelectedAppThemeAction,
} from "actions/appThemingActions";
import SettingSection from "./SettingSection";
import type { AppTheme } from "entities/AppTheming";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ThemeFontControl from "./controls/ThemeFontControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { Classes as CsClasses } from "@appsmith/ads-old";
import {
  Button,
  Menu,
  MenuContent,
  MenuTrigger,
  MenuItem,
} from "@appsmith/ads";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import { capitalizeFirstLetter } from "utils/helpers";

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
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const themingStack = useSelector(getAppThemingStack);

  /**
   * customizes the current theme
   */
  const updateSelectedTheme = useCallback(
    (theme: AppTheme) => {
      AnalyticsUtil.logEvent("APP_THEMING_CUSTOMIZE_THEME", {
        themeId: theme.id,
        themeName: theme.name,
      });

      dispatch(updateSelectedAppThemeAction({ applicationId, theme }));
    },
    [applicationId, dispatch],
  );

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickChangeThemeButton = useCallback(() => {
    AnalyticsUtil.logEvent("APP_THEMING_CHOOSE_THEME");

    dispatch(
      setAppThemingModeStackAction([
        ...themingStack,
        AppThemingMode.APP_THEME_SELECTION,
      ]),
    );
  }, [dispatch, themingStack]);

  /**
   * resets theme
   */
  const onResetTheme = useCallback(() => {
    dispatch(resetThemeAction());
  }, [dispatch, resetThemeAction]);

  return (
    <>
      <header className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SubText>Theme properties</SubText>
          </div>
          <div>
            <Menu>
              <MenuTrigger>
                <Button
                  isIconButton
                  kind="tertiary"
                  size="md"
                  startIcon="context-menu"
                />
              </MenuTrigger>
              <MenuContent align="end" className="t--save-theme-menu">
                <MenuItem onClick={onResetTheme} startIcon="arrow-go-back">
                  Reset widget styles
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </div>

        <ThemeCard theme={selectedTheme}>
          <aside
            className={`absolute left-0 top-0 bottom-0 right-0 items-center justify-center hidden group-hover:flex  backdrop-filter bg-gray-900 bg-opacity-50 backdrop-blur-sm `}
          >
            <Button
              className="t--change-theme-btn"
              onClick={onClickChangeThemeButton}
              size="md"
            >
              Change theme
            </Button>
          </aside>
        </ThemeCard>
      </header>
      <main className="mt-1">
        {/* FONT  */}
        <SettingSection className="px-4 py-3" isDefaultOpen title="Font">
          {Object.keys(selectedTheme.config.fontFamily).map(
            (fontFamilySectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <SubText>
                    {capitalizeFirstLetter(startCase(fontFamilySectionName))}
                  </SubText>
                  <ThemeFontControl
                    options={get(
                      selectedTheme,
                      `config.fontFamily.${fontFamilySectionName}`,
                      [],
                    )}
                    sectionName={fontFamilySectionName}
                    selectedOption={get(
                      selectedTheme,
                      `properties.fontFamily.${fontFamilySectionName}`,
                    )}
                    theme={selectedTheme}
                    updateTheme={updateSelectedTheme}
                  />
                </section>
              );
            },
          )}
        </SettingSection>
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
          {Object.keys(selectedTheme.config.borderRadius).map(
            (borderRadiusSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <SubText>
                    {capitalizeFirstLetter(startCase(borderRadiusSectionName))}
                  </SubText>
                  <ThemeBorderRadiusControl
                    options={get(
                      selectedTheme,
                      `config.borderRadius.${borderRadiusSectionName}`,
                      {},
                    )}
                    sectionName={borderRadiusSectionName}
                    selectedOption={get(
                      selectedTheme,
                      `properties.borderRadius.${borderRadiusSectionName}`,
                    )}
                    theme={selectedTheme}
                    updateTheme={updateSelectedTheme}
                  />
                </section>
              );
            },
          )}
        </SettingSection>

        {/* BOX SHADOW */}
        <SettingSection
          className="px-4 py-3 border-t "
          isDefaultOpen
          title="Shadow"
        >
          {Object.keys(selectedTheme.config.boxShadow).map(
            (boxShadowSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <SubText>
                    {capitalizeFirstLetter(startCase(boxShadowSectionName))}
                  </SubText>
                  <ThemeBoxShadowControl
                    options={get(
                      selectedTheme,
                      `config.boxShadow.${boxShadowSectionName}`,
                      {},
                    )}
                    sectionName={boxShadowSectionName}
                    selectedOption={get(
                      selectedTheme,
                      `properties.boxShadow.${boxShadowSectionName}`,
                    )}
                    theme={selectedTheme}
                    updateTheme={updateSelectedTheme}
                  />
                </section>
              );
            },
          )}
        </SettingSection>
      </main>
      <PopoverStyles />
    </>
  );
}

export default ThemeEditor;
