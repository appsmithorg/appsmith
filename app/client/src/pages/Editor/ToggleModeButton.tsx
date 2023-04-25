import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Category,
  IconPositions,
  Size,
  TooltipComponent,
} from "design-system-old";

import type { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";

import { getAppMode } from "@appsmith/selectors/applicationSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { isExploringSelector } from "selectors/onboardingSelectors";
import { Colors } from "constants/Colors";
import { createMessage, EDITOR_HEADER } from "ce/constants/messages";

const StyledButton = styled(Button)<{ active: boolean }>`
  ${(props) =>
    props.active &&
    `
  background-color: ${Colors.GREY_200};
  border: 1.2px solid transparent;
  `}
  padding: 0 ${(props) => props.theme.spaces[2]}px;
  color: ${Colors.GREY_900};
  height: ${(props) => props.theme.smallHeaderHeight};

  svg {
    height: 18px;
    width: 18px;
  }
`;

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
    <TooltipComponent
      content={
        <>
          {createMessage(EDITOR_HEADER.previewTooltip.text)}
          <span style={{ color: "#fff", marginLeft: 20 }}>
            {createMessage(EDITOR_HEADER.previewTooltip.shortcut)}
          </span>
        </>
      }
      disabled={appMode !== APP_MODE.EDIT}
      hoverOpenDelay={1000}
      position="bottom"
    >
      <StyledButton
        active={isPreviewMode}
        category={Category.tertiary}
        data-cy={`${isPreviewMode ? "preview" : "edit"}-mode`}
        icon={"play-circle-line"}
        iconPosition={IconPositions.left}
        onClick={onClickPreviewModeButton}
        size={Size.medium}
        tag={"button"}
        text={createMessage(EDITOR_HEADER.previewTooltip.text).toUpperCase()}
      />
    </TooltipComponent>
  );
}

export default ToggleModeButton;
