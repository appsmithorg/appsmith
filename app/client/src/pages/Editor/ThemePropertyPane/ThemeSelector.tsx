import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import ThemeList from "./ThemeList";
import {
  getAppThemes,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { ThemeCard } from "./ThemeCard";
import { SettingSection } from "./SettingSection";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";
import { setAppThemingModeStackAction } from "actions/appThemingActions";

function ThemeSelector() {
  const dispatch = useDispatch();
  const themes = useSelector(getAppThemes);
  const themingStack = useSelector(getAppThemingStack);
  const selectedTheme = useSelector(getSelectedAppTheme);

  /**
   * goes to previous screen in the pane
   */
  const onClickBack = useCallback(() => {
    dispatch(setAppThemingModeStackAction(themingStack.slice(0, -1)));
  }, [setAppThemingModeStackAction]);

  return (
    <div className="relative">
      <header className="sticky top-0 items-center justify-between bg-white z-1 ">
        <button
          className="inline-flex items-center px-3 py-2 space-x-1 text-gray-500 cursor-pointer t--theme-select-back-btn"
          onClick={onClickBack}
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-all transform" />
          <h3 className="text-xs font-medium uppercase">Back</h3>
        </button>
        <SettingSection
          className="px-3 py-3 border-t border-b"
          isOpen
          title="Current Theme"
        >
          <ThemeCard theme={selectedTheme} />
        </SettingSection>
      </header>
      <header className="relative px-3 py-3 space-y-3">
        <h3 className="text-sm font-medium uppercase">Other Themes</h3>
        <ThemeList themes={themes} />
      </header>
    </div>
  );
}

export default ThemeSelector;
