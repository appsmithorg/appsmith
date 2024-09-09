import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  getAppThemes,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { ThemeCard } from "./ThemeCard";
import { SettingSection } from "./SettingSection";
import { setAppThemingModeStackAction } from "actions/appThemingActions";
import styled from "styled-components";
import { Link } from "@appsmith/ads";

const Title = styled.h3`
  color: var(--ads-v2-color-fg-emphasis);
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
  const userSavedThemes = themes
    .filter((theme) => theme.isSystemTheme === false)
    .filter((theme) => !theme.config.isDeprecated);

  /**
   * stores default system themes
   */
  const systemThemes = themes
    .filter((theme) => theme.isSystemTheme === true)
    .filter((theme) => !theme.config.isDeprecated)
    .sort((a, b) => a.config.order - b.config.order);

  return (
    <div className="relative">
      <section className="sticky top-0 items-center justify-between bg-white z-1 ">
        <Link
          className="px-3 py-2 space-x-1 t--theme-select-back-btn"
          kind="secondary"
          onClick={onClickBack}
          startIcon="back-control"
        >
          Back
        </Link>
        <SettingSection
          className="px-4 py-3 border-t border-b"
          isDefaultOpen={false}
          title="Applied theme"
        >
          <ThemeCard theme={selectedTheme} />
        </SettingSection>
      </section>
      {userSavedThemes.length > 0 && (
        <section className="relative p-4 space-y-3">
          <Title className="text-sm font-medium">Your themes</Title>
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
      <section
        className="relative p-4 space-y-3"
        data-testid="t--featured-themes"
      >
        <Title className="text-sm font-medium">Featured themes</Title>
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
