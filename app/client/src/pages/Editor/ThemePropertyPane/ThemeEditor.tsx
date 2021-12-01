import React from "react";
import { startCase } from "lodash";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { useSelector } from "react-redux";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import ColorPickerComponent from "components/ads/ColorPickerComponentV2";

function ThemeEditor() {
  const selectedTheme = useSelector(getSelectedAppTheme);

  return (
    <>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard theme={selectedTheme} />
      </header>
      <main>
        <SettingSection className="border-t" title="Colour">
          <section className="space-y-2">
            <ThemeColorControl theme={selectedTheme} />
          </section>
        </SettingSection>
        <SettingSection className="border-t" title="Border Radius">
          {Object.keys(selectedTheme.config.borderRadius).map(
            (borderRadiusSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3 className="font-semibold">
                    {startCase(borderRadiusSectionName)}
                  </h3>
                  <ThemeBorderRadiusControl
                    options={
                      selectedTheme.config.borderRadius[borderRadiusSectionName]
                    }
                  />
                </section>
              );
            },
          )}
        </SettingSection>
        <SettingSection className="border-t" title="Box Shadow">
          {Object.keys(selectedTheme.config.boxShadow).map(
            (boxShadowSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3 className="font-semibold">
                    {startCase(boxShadowSectionName)}
                  </h3>
                  <ThemeBoxShadowControl />
                </section>
              );
            },
          )}
        </SettingSection>
        <SettingSection className="border-t border-b" title="Box Shadow Color">
          {Object.keys(selectedTheme.config.boxShadowColor).map(
            (boxShadowColorSectionName: string, index: number) => {
              return (
                <section className="space-y-2" key={index}>
                  <h3 className="font-semibold">
                    {startCase(boxShadowColorSectionName)}
                  </h3>
                  <div>
                    <ColorPickerComponent
                      changeColor={() => {
                        //
                      }}
                      color={
                        selectedTheme.config.boxShadowColor[
                          boxShadowColorSectionName
                        ]
                      }
                    />
                  </div>
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
