import React, { useCallback } from "react";
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
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownList,
} from "components/ads/DropdownV2";
import MoreIcon from "remixicon-react/MoreFillIcon";
import { useDisclosure } from "@chakra-ui/react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "components/ads/Modal";
import TextInput from "components/ads/TextInput";
import Checkbox from "components/ads/Checkbox";
import CloseIcon from "remixicon-react/CloseLineIcon";

function ThemeEditor() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const themingStack = useSelector(getAppThemingStack);
  const { isOpen, onClose, onOpen } = useDisclosure();

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
            <Dropdown>
              <DropdownButton>
                <MoreIcon className="w-5 h-5 text-gray-600" />
              </DropdownButton>
              <DropdownList>
                <DropdownItem onClick={onOpen}>Save theme</DropdownItem>
                <DropdownItem>Reset theme</DropdownItem>
              </DropdownList>
            </Dropdown>
          </div>
          <ThemeCard changeable theme={selectedTheme} />
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
      <Modal isCentered isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <div className="flex justify-between px-6 py-6">
              <h2 className="text-xl">Save Theme</h2>
              <button onClick={onClose}>
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="px-6 pb-6 border-b">
              <p>
                You can save your custom themes to use across applications and
                use them when you need.
              </p>
              <div className="mt-4 space-y-2">
                <h3 className="text-gray-700">Your theme name</h3>
                <TextInput placeholder="My Theme" width="100%" />
              </div>
            </div>
            <div className="p-6">
              <p className="text-base">Want to share your customised theme?</p>
              <p className="mt-2 text-gray-600">
                You can submit your theme to Appsmith to be included in our as
                part of our prefined themes.
              </p>
              <div className="mt-3">
                <Checkbox label="Submit this theme to Appsmith" />
              </div>
            </div>
          </ModalBody>
          <ModalFooter justifyContent="flex-start">
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-center space-x-3">
                <Button
                  category={Category.tertiary}
                  onClick={onClickChangeThemeButton}
                  size={Size.medium}
                  text="Cancel"
                />
                <Button
                  category={Category.primary}
                  onClick={onClickChangeThemeButton}
                  size={Size.medium}
                  text="Save theme"
                />
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default ThemeEditor;
