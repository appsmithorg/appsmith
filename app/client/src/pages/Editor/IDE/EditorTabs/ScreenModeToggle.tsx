import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "design-system";

import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import {
  MAXIMIZE_BUTTON_TOOLTIP,
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import { setIdeEditorViewMode } from "actions/ideActions";

export const ScreenModeToggle = () => {
  const dispatch = useDispatch();
  const ideViewMode = useSelector(getIDEViewMode);

  const switchToFullScreen = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });

    // Animating using https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
    // this has limited availability right now
    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
      });
    } else {
      dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
    }
  }, [dispatch]);

  const switchToSplitScreen = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.SplitScreen,
    });
    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
      });
    } else {
      dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    }
  }, [dispatch]);

  if (ideViewMode === EditorViewMode.SplitScreen) {
    return (
      <Tooltip
        content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}
        key={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}
      >
        <Button
          className="ml-auto !min-w-[24px]"
          data-testid={"t--ide-maximize"}
          id={"editor-mode-maximize"}
          isIconButton
          kind="tertiary"
          onClick={switchToFullScreen}
          startIcon={"maximize-v3"}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip
      content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
      key={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
    >
      <Button
        className="ml-auto !min-w-[24px]"
        data-testid={"t--ide-minimize"}
        id={"editor-mode-minimize"}
        isIconButton
        kind="tertiary"
        onClick={switchToSplitScreen}
        startIcon={"minimize-v3"}
      />
    </Tooltip>
  );
};
