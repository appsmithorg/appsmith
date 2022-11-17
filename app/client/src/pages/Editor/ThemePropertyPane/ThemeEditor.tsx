import styled, { createGlobalStyle } from "styled-components";
import { get, startCase } from "lodash";
import MoreIcon from "remixicon-react/MoreFillIcon";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback, useState } from "react";
import Save2LineIcon from "remixicon-react/Save2LineIcon";
import ArrowGoBackIcon from "remixicon-react/ArrowGoBackFillIcon";

import ThemeCard from "./ThemeCard";
import {
  DropdownV2,
  DropdownList,
  DropdownItem,
  DropdownTrigger,
} from "design-system";
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
import SaveThemeModal from "./SaveThemeModal";
import { AppTheme } from "entities/AppTheming";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ThemeFontControl from "./controls/ThemeFontControl";
import ThemeColorControl from "./controls/ThemeColorControl";
import { Button, Category, Classes as CsClasses, Size } from "design-system";
import ThemeBoxShadowControl from "./controls/ThemeShadowControl";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import ThemeBorderRadiusControl from "./controls/ThemeBorderRadiusControl";
import BetaCard from "components/editorComponents/BetaCard";
import { Colors } from "constants/Colors";

const THEMING_BETA_CARD_POPOVER_CLASSNAME = `theming-beta-card-popover`;

const Title = styled.h3`
  color: ${Colors.GRAY_800};
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

  /**
   * resets theme
   */
  const onResetTheme = useCallback(() => {
    dispatch(resetThemeAction());
  }, [dispatch, resetThemeAction]);

  return (
    <>
      <div>
        <header className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Title className="text-sm font-normal capitalize">
                Theme Properties
              </Title>
              <BetaCard />
            </div>
            <div>
              <DropdownV2 position="bottom-right">
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
                  <DropdownItem
                    className="flex items-center"
                    icon={<ArrowGoBackIcon className="w-4 h-4" />}
                    onClick={onResetTheme}
                    text="Reset widget styles"
                  />
                </DropdownList>
              </DropdownV2>
            </div>
          </div>

          <ThemeCard theme={selectedTheme}>
            <aside
              className={`absolute left-0 top-0 bottom-0 right-0 items-center justify-center hidden group-hover:flex  backdrop-filter bg-gray-900 bg-opacity-50 backdrop-blur-sm `}
            >
              <Button
                category={Category.primary}
                className="t--change-theme-btn"
                onClick={onClickChangeThemeButton}
                size={Size.medium}
                text="Change Theme"
              />
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
          <SettingSection
            className="px-4 py-3 border-t "
            isDefaultOpen
            title="Shadow"
          >
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
