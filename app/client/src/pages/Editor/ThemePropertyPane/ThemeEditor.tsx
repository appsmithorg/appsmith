import React, { useCallback } from "react";
import { get, startCase } from "lodash";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { useDispatch, useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import { updateSelectedThemeAction } from "actions/appThemingActions";
import { AppTheme } from "entities/AppTheming";
import ThemeFontControl from "./controls/ThemeFontControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";

function ThemeEditor() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);

  const updateSelectedTheme = useCallback(
    (theme: AppTheme) => {
      dispatch(updateSelectedThemeAction({ applicationId, theme }));
    },
    [updateSelectedThemeAction],
  );

  return (
    <>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard theme={selectedTheme} />
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
        <SettingSection className="border-t" title="Border Radius">
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
        <SettingSection className="border-t" title="Box Shadow">
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
        <SettingSection className="border-t" title="Font">
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
