import { createGlobalStyle } from "styled-components";
import { get, startCase } from "lodash";
import MoreIcon from "remixicon-react/MoreFillIcon";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback, useState } from "react";
import Save2LineIcon from "remixicon-react/Save2LineIcon";

import ThemeCard from "./ThemeCard";
import {
  Dropdown,
  DropdownList,
  DropdownItem,
  DropdownTrigger,
} from "components/ads/DropdownV2";
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
import SaveThemeModal from "./SaveThemeModal";
import { AppTheme } from "entities/AppTheming";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ThemeFontControl from "./controls/ThemeFontControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import Button, { Category, Size } from "components/ads/Button";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import BetaCard from "components/editorComponents/BetaCard";
import { Classes as CsClasses } from "components/ads/common";

const THEMING_BETA_CARD_POPOVER_CLASSNAME = `theming-beta-card-popover`;

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
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);

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
    [updateSelectedAppThemeAction],
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
  }, [setAppThemingModeStackAction]);

  /**
   * open the save modal
   */
  const onOpenSaveModal = useCallback(() => {
    AnalyticsUtil.logEvent("APP_THEMING_SAVE_THEME_START");

    setSaveModalOpen(true);
  }, [setSaveModalOpen]);

  /**
   * on close save modal
   */
  const onCloseSaveModal = useCallback(() => {
    setSaveModalOpen(false);
  }, [setSaveModalOpen]);

  return (
    <>
      <div className="">
        <header className="px-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-normal capitalize">
                Theme Properties
              </h3>
              <BetaCard />
            </div>
            <div>
              <Dropdown position="bottom-right">
                <DropdownTrigger>
                  <button className="p-1 hover:bg-gray-100 active:bg-gray-100">
                    <MoreIcon className="w-5 h-5" />
                  </button>
                </DropdownTrigger>
                <DropdownList>
                  <DropdownItem
                    className="flex items-center"
                    icon={<Save2LineIcon className="w-4 h-4" />}
                    onClick={onOpenSaveModal}
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
            text="Change Theme"
          />
        </div>
        <main className="mt-1">
          {/* FONT  */}
          <SettingSection className="px-3 py-3" isOpen title="Font">
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
          {/* COLORS */}
          <SettingSection className="px-3 py-3 border-t" isOpen title="Color">
            <section className="space-y-2">
              <ThemeColorControl
                theme={selectedTheme}
                updateTheme={updateSelectedTheme}
              />
            </section>
          </SettingSection>

          {/* BORDER RADIUS */}
          <SettingSection className="px-3 py-3 border-t " isOpen title="Border">
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
          <SettingSection className="px-3 py-3 border-t " isOpen title="Shadow">
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
        </main>
      </div>
      <SaveThemeModal isOpen={isSaveModalOpen} onClose={onCloseSaveModal} />
      <PopoverStyles />
    </>
  );
}

export default ThemeEditor;
