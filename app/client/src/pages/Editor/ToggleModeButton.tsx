import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "design-system";

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
      <Button
        data-testid={`${isPreviewMode ? "preview" : "edit"}-mode`}
        // TODO: (Albin) - check with design team for a better UI
        // isDisabled={isPreviewMode}
        kind="tertiary"
        onClick={onClickPreviewModeButton}
        size="md"
        startIcon="play-circle-line"
      >
        {createMessage(EDITOR_HEADER.previewTooltip.text)}
      </Button>
    </Tooltip>
  );
}

export default ToggleModeButton;
