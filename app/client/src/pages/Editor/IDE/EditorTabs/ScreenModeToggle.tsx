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

  const toggleEditorMode = useCallback(() => {
    const newMode =
      ideViewMode === EditorViewMode.SplitScreen
        ? EditorViewMode.FullScreen
        : EditorViewMode.SplitScreen;

    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: newMode,
    });
    dispatch(setIdeEditorViewMode(newMode));
  }, [ideViewMode, dispatch]);

  return (
    <Tooltip
      content={
        ideViewMode === EditorViewMode.SplitScreen
          ? createMessage(MAXIMIZE_BUTTON_TOOLTIP)
          : createMessage(MINIMIZE_BUTTON_TOOLTIP)
      }
    >
      <Button
        className="ml-auto !min-w-[24px]"
        data-testid={
          ideViewMode === EditorViewMode.SplitScreen
            ? "t--ide-maximize"
            : "t--ide-minimize"
        }
        id={
          ideViewMode === EditorViewMode.SplitScreen
            ? "editor-mode-maximize"
            : "editor-mode-minimize"
        }
        isIconButton
        kind="tertiary"
        onClick={toggleEditorMode}
        startIcon={
          ideViewMode === EditorViewMode.SplitScreen
            ? "maximize-v3"
            : "minimize-v3"
        }
      />
    </Tooltip>
  );
};
