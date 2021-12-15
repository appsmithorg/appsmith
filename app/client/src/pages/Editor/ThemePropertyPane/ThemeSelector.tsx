import React, { useCallback, useMemo } from "react";
import ThemeList from "./ThemeList";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";
import { useDispatch, useSelector } from "react-redux";
import { setAppThemingModeStack } from "actions/appThemingActions";
import {
  getAppThemes,
  getAppThemingStack,
  getSelectedAppTheme,
} from "selectors/appThemingSelectors";
import { ThemeCard } from "./ThemeCard";

function ThemeSelector() {
  const dispatch = useDispatch();
  const themes = useSelector(getAppThemes);
  const themingStack = useSelector(getAppThemingStack);
  const selectedTheme = useSelector(getSelectedAppTheme);
  const otherThemes = useMemo(() => {
    return themes.filter((theme) => theme.name !== selectedTheme.name);
  }, [selectedTheme]);

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickBack = useCallback(() => {
    dispatch(setAppThemingModeStack(themingStack.slice(0, -1)));
  }, [setAppThemingModeStack]);

  return (
    <>
      <button
        className="inline-flex items-center px-3 space-x-1 text-gray-500 cursor-pointer "
        onClick={onClickBack}
        type="button"
      >
        <ArrowLeft className="w-4 h-4 transition-all transform" />
        <h3 className="text-xs font-medium uppercase">Back</h3>
      </button>
      {/* <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Current Theme</h3>
        <ThemeCard
          changeable={false}
          editable={false}
          isSelected
          selectable={false}
          theme={selectedTheme}
        />
      </header> */}
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Themes</h3>
        <ThemeList themes={themes} />
      </header>
    </>
  );
}

export default ThemeSelector;
