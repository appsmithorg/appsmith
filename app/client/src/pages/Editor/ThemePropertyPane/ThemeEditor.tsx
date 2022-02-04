import React, { useCallback, useState } from "react";
import { get, startCase } from "lodash";

import ThemeCard from "./ThemeCard";
import SettingSection from "./SettingSection";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { useDispatch, useSelector } from "react-redux";
import {
  AppThemingMode,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import {
  setAppThemingModeStackAction,
  updateSelectedAppThemeAction,
} from "actions/appThemingActions";
import { AppTheme } from "entities/AppTheming";
import ThemeFontControl from "./controls/ThemeFontControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import Button, { Category, Size } from "components/ads/Button";
import MoreIcon from "remixicon-react/MoreFillIcon";
import DownloadIcon from "remixicon-react/DownloadLineIcon";
import SaveThemeModal from "./SaveThemeModal";
import { Popover, Position } from "@blueprintjs/core";
import { Popover2 } from "@blueprintjs/popover2";
import Menu from "components/ads/Menu";
import MenuItem from "components/ads/MenuItem";
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  DropdownTrigger,
} from "components/ads/DropdownV2";

function ThemeEditor() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const themingStack = useSelector(getAppThemingStack);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);

  const updateSelectedTheme = useCallback(
    (theme: AppTheme) => {
      dispatch(updateSelectedAppThemeAction({ applicationId, theme }));
    },
    [updateSelectedAppThemeAction],
  );

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickChangeThemeButton = useCallback(() => {
    dispatch(
      setAppThemingModeStackAction([
        ...themingStack,
        AppThemingMode.APP_THEME_SELECTION,
      ]),
    );
  }, [setAppThemingModeStackAction]);

  return (
    <>
      <div className="">
        <header className="px-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-normal capitalize">Theme Properties</h3>
            <div>
              <Dropdown>
                <DropdownTrigger>
                  <MoreIcon />
                </DropdownTrigger>
                <DropdownList>
                  <DropdownItem
                    onClick={() => {
                      setSaveModalOpen(true);
                    }}
                    text="Save theme"
                  />
                </DropdownList>
              </Dropdown>
            </div>
          </div>
          <ThemeCard theme={selectedTheme} />
        </header>
        <div className="px-3 mt-4">
          <Button
            category={Category.tertiary}
            className="t--change-theme-btn"
            onClick={onClickChangeThemeButton}
            size={Size.medium}
            text="Choose a Theme"
          />
        </div>
        <main className="mt-1">
          {/* COLORS */}
          <SettingSection className="px-3 py-3 " title="Colour">
            <section className="space-y-2">
              <ThemeColorControl
                theme={selectedTheme}
                updateTheme={updateSelectedTheme}
              />
            </section>
          </SettingSection>

          {/* BORDER RADIUS */}
          <SettingSection className="px-3 py-3 border-t " title="Border Radius">
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
          <SettingSection className="px-3 py-3 border-t " title="Box Shadow">
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
          <SettingSection className="px-3 py-3 border-t" title="Font">
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
      </div>
      <SaveThemeModal
        isOpen={isSaveModalOpen}
        onClose={() => {
          setSaveModalOpen(false);
        }}
      />
    </>
  );
}

export default ThemeEditor;
