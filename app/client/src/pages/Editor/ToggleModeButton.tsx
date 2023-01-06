import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Category,
  IconPositions,
  Size,
  TooltipComponent,
} from "design-system";

import { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";

import { getAppMode } from "selectors/applicationSelectors";
import { setPreviewModeInitAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { isExploringSelector } from "selectors/onboardingSelectors";
import { Colors } from "constants/Colors";

const StyledButton = styled(Button)<{ active: boolean }>`
  ${(props) =>
    props.active &&
    `
  background-color: ${Colors.GREY_200};
  border: 1.2px solid transparent;
  `}
  padding: 0 6px;
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
          Preview Mode
          <span style={{ color: "#fff", marginLeft: 20 }}>P</span>
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
        text="PREVIEW"
      />
    </TooltipComponent>
  );
}

export default ToggleModeButton;
