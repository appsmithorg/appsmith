import React, { useCallback } from "react";
import ThemeList from "./ThemeList";
import ArrowLeft from "remixicon-react/ArrowLeftSLineIcon";
import { useDispatch, useSelector } from "react-redux";
import { setAppThemingMode } from "actions/appThemingActions";
import { getAppThemes, AppThemingMode } from "selectors/appThemingSelectors";

function ThemeSelector() {
  const dispatch = useDispatch();
  const themes = useSelector(getAppThemes);

  /**
   * sets the mode to THEME_EDIT
   */
  const onClickBack = useCallback(() => {
    dispatch(setAppThemingMode(AppThemingMode.APP_THEME_EDIT));
  }, [setAppThemingMode]);

  return (
    <div className="space-y-2">
      <button
        className="inline-flex items-center px-3 space-x-1 text-gray-500 cursor-pointer "
        onClick={onClickBack}
        type="button"
      >
        <ArrowLeft className="w-4 h-4 transition-all transform" />
        <h3 className="text-xs font-medium uppercase">Back</h3>
      </button>
      <div className="px-3 space-y-3">
        <ThemeList themes={themes} />
      </div>
    </div>
  );
}

export default ThemeSelector;
