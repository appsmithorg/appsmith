import React, { useCallback } from "react";
import { get, startCase } from "lodash";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { useDispatch, useSelector } from "react-redux";
import {
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import {
  setAppThemingModeStack,
  updateSelectedAppThemeAction,
} from "actions/appThemingActions";
import { AppTheme } from "entities/AppTheming";
import ThemeFontControl from "./controls/ThemeFontControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";

function ThemeEditor() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const themingStack = useSelector(getAppThemingStack);

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickBack = useCallback(() => {
    dispatch(setAppThemingModeStack(themingStack.slice(0, -1)));
  }, [setAppThemingModeStack]);

  const updateSelectedTheme = useCallback(
    (theme: AppTheme) => {
      dispatch(updateSelectedAppThemeAction({ applicationId, theme }));
    },
    [updateSelectedAppThemeAction],
  );

  return (
    <>
      <header className="flex items-center justify-between px-3 ">
        <button
          className="inline-flex items-center h-5 space-x-1 text-gray-500 cursor-pointer"
          onClick={onClickBack}
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-all transform" />
          <h3 className="text-xs font-medium uppercase">Back</h3>
        </button>
      </header>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard changeable theme={selectedTheme} />
      </header>
      <main>
        {/* COLORS */}
        <SettingSection className="border-t" isOpen title="Colour">
          <section className="space-y-2">
            <ThemeColorControl
              theme={selectedTheme}
              updateTheme={updateSelectedTheme}
            />
          </section>
        </SettingSection>

        {/* BORDER RADIUS */}
        <SettingSection className="border-t" isOpen title="Border Radius">
          {Object.keys(selectedTheme.config.borderRadius).map(
            (borderRadiusSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3>{startCase(borderRadiusSectionName)}</h3>
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
        <SettingSection className="border-t" isOpen title="Box Shadow">
          {Object.keys(selectedTheme.config.boxShadow).map(
            (boxShadowSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3>{startCase(boxShadowSectionName)}</h3>
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

        {/* FONT  */}
        <SettingSection className="border-t" isOpen title="Font">
          {Object.keys(selectedTheme.config.fontFamily).map(
            (fontFamilySectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3>{startCase(fontFamilySectionName)}</h3>
                  <ThemeFontControl
                    options={get(
                      selectedTheme,
                      `config.fontFamily.${fontFamilySectionName}`,
                      {},
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
      </main>
    </>
  );
}

export default ThemeEditor;
