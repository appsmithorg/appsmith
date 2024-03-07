import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tooltip, ToggleButton, Text, Flex } from "design-system";

import type { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";

import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { createMessage, EDITOR_HEADER } from "@appsmith/constants/messages";
import { getCanvasPreviewMode } from "selectors/ideSelectors";
import { altText } from "utils/helpers";

const TooltipText = (props: { text: () => string; shortcut: () => string }) => {
  return (
    <Flex gap="spaces-2">
      <Text color="var(--tooltip-color)">{createMessage(props.text)}</Text>
      <Text color="var(--ads-v2-color-fg-muted)">
        {`${altText()} ${createMessage(props.shortcut)}`}
      </Text>
    </Flex>
  );
};

function ToggleModeButton() {
  const dispatch = useDispatch();
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);
  const canvasPreviewMode = useSelector(getCanvasPreviewMode);

  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const onClickPreviewModeButton = useCallback(() => {
    dispatch(setPreviewModeInitAction(!isPreviewMode));
  }, [dispatch, setPreviewModeInitAction, isPreviewMode]);

  if (isViewMode) return null;

  return (
    <Tooltip
      content={
        <Flex alignItems="center" flexDirection="column">
          <TooltipText {...EDITOR_HEADER.previewTooltip.normal} />
          {canvasPreviewMode ? null : (
            <TooltipText {...EDITOR_HEADER.previewTooltip.quick} />
          )}
        </Flex>
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
