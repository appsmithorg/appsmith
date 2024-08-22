import React, { useCallback } from "react";

import { setPreviewModeInitAction } from "actions/editorActions";
import { EDITOR_HEADER, createMessage } from "ee/constants/messages";
import type { AppState } from "ee/reducers";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { APP_MODE } from "entities/App";
import { useDispatch, useSelector } from "react-redux";
import { previewModeSelector } from "selectors/editorSelectors";

import { ToggleButton, Tooltip } from "@appsmith/ads";

import { altText } from "../../utils/helpers";

function ToggleModeButton() {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);

  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const onClickPreviewModeButton = useCallback(() => {
    dispatch(setPreviewModeInitAction(!isPreviewMode));
  }, [dispatch, setPreviewModeInitAction, isPreviewMode]);

  if (isViewMode) return null;

  return (
    <Tooltip
      content={
        <>
          {createMessage(EDITOR_HEADER.previewTooltip.text)}
          <span style={{ marginLeft: 20 }}>
            {`${altText()} ${createMessage(
              EDITOR_HEADER.previewTooltip.shortcut,
            )}`}
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
