import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import ThemeList from "./ThemeList";
import {
  changeSelectedAppThemeAction,
  setAppThemingModeStack,
  setPreviewAppThemeAction,
} from "actions/appThemingActions";
import {
  getAppThemes,
  getAppThemingStack,
  getPreviewAppTheme,
} from "selectors/appThemingSelectors";
import Button from "components/ads/Button";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";
import { getCurrentApplicationId } from "selectors/editorSelectors";

function ThemeSelector() {
  const dispatch = useDispatch();
  const themes = useSelector(getAppThemes);
  const previewTheme = useSelector(getPreviewAppTheme);
  const themingStack = useSelector(getAppThemingStack);
  const applicationId = useSelector(getCurrentApplicationId);

  /**
   * goes to previous screen in the pane
   */
  const onClickBack = useCallback(() => {
    dispatch(setAppThemingModeStack(themingStack.slice(0, -1)));
    dispatch(setPreviewAppThemeAction());
  }, [setAppThemingModeStack]);

  /**
   * saves the preview theme
   */
  const onClickSave = useCallback(() => {
    if (previewTheme) {
      dispatch(
        changeSelectedAppThemeAction({ applicationId, theme: previewTheme }),
      );
    }
  }, [changeSelectedAppThemeAction, previewTheme, applicationId]);

  return (
    <>
      <header className="flex items-center justify-between px-3 ">
        <button
          className="inline-flex items-center h-5 space-x-1 text-gray-500 cursor-pointer t--theme-select-back-btn"
          onClick={onClickBack}
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-all transform" />
          <h3 className="text-xs font-medium uppercase">Back</h3>
        </button>

        <Button
          className="t--save-theme-btn"
          disabled={!previewTheme}
          onClick={onClickSave}
          text="Save Changes"
        />
      </header>
      <header className="px-3 space-y-2">
        <h3 className="text-sm font-medium uppercase">Themes</h3>
        <ThemeList themes={themes} />
      </header>
    </>
  );
}

export default ThemeSelector;
