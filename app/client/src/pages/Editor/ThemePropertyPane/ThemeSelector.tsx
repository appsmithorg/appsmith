import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAppThemes,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { ThemeCard } from "./ThemeCard";
import { SettingSection } from "./SettingSection";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";
import { setAppThemingModeStackAction } from "actions/appThemingActions";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Title = styled.h3`
  color: ${Colors.GRAY_800};
`;

function ThemeSelector() {
  const dispatch = useDispatch();
  const themes = useSelector(getAppThemes);
  const themingStack = useSelector(getAppThemingStack);
  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * goes to previous screen in the pane
   */
  const onClickBack = () => {
    dispatch(setAppThemingModeStackAction(themingStack.slice(0, -1)));
  };

  /**
   * stores user saved themes
   */
  const userSavedThemes = themes.filter(
    (theme) => theme.isSystemTheme === false,
  );

  /**
   * stores default system themes
   */
  const systemThemes = themes.filter((theme) => theme.isSystemTheme === true);

  return (
    <div className="relative">
      <section className="sticky top-0 items-center justify-between bg-white z-1 ">
        <button
          className="inline-flex items-center px-3 py-2 space-x-1 text-gray-500 cursor-pointer t--theme-select-back-btn"
          onClick={onClickBack}
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-all transform" />
          <h3 className="text-xs font-medium uppercase">Back</h3>
        </button>
        <SettingSection
          className="px-4 py-3 border-t border-b"
          isDefaultOpen={false}
          title="Applied Theme"
        >
          <ThemeCard theme={selectedTheme} />
        </SettingSection>
      </section>
      {userSavedThemes.length > 0 && (
        <section className="relative p-4 space-y-3">
          <Title className="text-sm font-medium capitalize">Your Themes</Title>
          {userSavedThemes.map((theme) => (
            <ThemeCard
              deletable={!theme.isSystemTheme}
              key={theme.id}
              selectable
              theme={theme}
            />
          ))}
        </section>
      )}
      <section className="relative p-4 space-y-3">
        <Title className="text-sm font-medium capitalize">
          Featured Themes
        </Title>
        {systemThemes.map((theme) => (
          <ThemeCard
            deletable={!theme.isSystemTheme}
            key={theme.id}
            selectable
            theme={theme}
          />
        ))}
      </section>
    </div>
  );
}

export default ThemeSelector;
