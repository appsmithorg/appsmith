import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, ToggleButton } from "design-system";

import type { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";

import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { isExploringSelector } from "selectors/onboardingSelectors";
import { createMessage, EDITOR_HEADER } from "@appsmith/constants/messages";

function ToggleModeButton() {
  const dispatch = useDispatch();
  const isExploring = useSelector(isExploringSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);

  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const onClickPreviewModeButton = useCallback(() => {
    dispatch(setPreviewModeInitAction(!isPreviewMode));
  }, [dispatch, setPreviewModeInitAction, isPreviewMode]);

  if (isExploring || isViewMode) return null;

  return (
    <Tooltip
      content={
        <>
          {createMessage(EDITOR_HEADER.previewTooltip.text)}
          <span style={{ marginLeft: 20 }}>
            {createMessage(EDITOR_HEADER.previewTooltip.shortcut)}
          </span>
        </>
      }
      isDisabled={appMode !== APP_MODE.EDIT}
      placement="bottom"
    >
      <ToggleButton
        data-testid={`${isPreviewMode ? "preview" : "edit"}-mode`}
        icon="play-line"
        isSelected={isPreviewMode}
        onClick={onClickPreviewModeButton}
        size="md"
      />
    </Tooltip>
  );
}

export default ToggleModeButton;
