import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, ToggleButton } from "@appsmith/ads";

import type { DefaultRootState } from "react-redux";
import { APP_MODE } from "entities/App";

import { getAppMode } from "ee/selectors/applicationSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { createMessage, EDITOR_HEADER } from "ee/constants/messages";
import { altText } from "../../utils/helpers";

function ToggleModeButton() {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);

  const mode = useSelector(
    (state: DefaultRootState) => state.entities.app.mode,
  );
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
