import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import MenuIcon from "remixicon-react/MenuLineIcon";
import Button, { Category } from "components/ads/Button";
import { setThemeModeAction } from "actions/editorActions";
import { themeModeSelector } from "selectors/editorSelectors";
import { getExplorerPinned } from "selectors/explorerSelector";
import PaintBrushIcon from "remixicon-react/PaintBrushLineIcon";
import { setExplorerActiveAction } from "actions/explorerActions";
import { setAppThemingModeAction } from "actions/appThemingActions";
import { AppThemingMode } from "selectors/appThemingSelectors";

function Toolbar() {
  const dispatch = useDispatch();
  const isThemeMode = useSelector(themeModeSelector);
  const explorerPinned = useSelector(getExplorerPinned);

  /**
   * on hovering the menu, make the explorer active
   */
  const onMenuHover = useCallback(() => {
    dispatch(setExplorerActiveAction(true));
  }, [setExplorerActiveAction]);

  /**
   * on hovering the menu, make the explorer active
   */
  const onThemeButtonClick = useCallback(() => {
    dispatch(setThemeModeAction(true));
  }, [setThemeModeAction]);

  /**
   * on hovering the menu, make the explorer active
   */
  const onBackToCanvasButtonClick = useCallback(() => {
    dispatch(setThemeModeAction(false));
    dispatch(setAppThemingModeAction(AppThemingMode.APP_THEME_EDIT));
  }, [setThemeModeAction]);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b z-1">
      <div>
        {explorerPinned === false && (
          <MenuIcon
            className="w-5 h-5 cursor-pointer text-trueGray-600"
            onMouseEnter={onMenuHover}
          />
        )}
      </div>
      <div>
        <div className="flex items-center space-x-2">
          {isThemeMode && (
            <>
              <Button
                category={Category.tertiary}
                onClick={onBackToCanvasButtonClick}
                text="Back to Canvas"
              />
              <Button text="Save changes" />
            </>
          )}
          {!isThemeMode && (
            <PaintBrushIcon
              className="w-5 h-5 cursor-pointer text-trueGray-600 hover:bg-trueGray-100 ring-3 ring-transparent hover:ring-trueGray-100"
              onClick={onThemeButtonClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;
