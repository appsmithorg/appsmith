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

import { AppState } from "@appsmith/reducers";
import { APP_MODE } from "entities/App";

import { getAppMode } from "selectors/applicationSelectors";

import { isExploringSelector } from "selectors/onboardingSelectors";
import { Colors } from "constants/Colors";
import { createMessage, EDITOR_HEADER } from "ce/constants/messages";
import {
  setIsBackOfficeConnected,
  setIsBackOfficeModalOpen,
} from "actions/backOfficeActions";
import { getIsBackOfficeConnected } from "selectors/backOfficeSelectors";

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

function BackOfficeButton() {
  const dispatch = useDispatch();
  const isExploring = useSelector(isExploringSelector);
  const isBackOfficeConnected = useSelector(getIsBackOfficeConnected);
  const appMode = useSelector(getAppMode);

  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const setConnectionStatus = useCallback(() => {
    dispatch(setIsBackOfficeConnected(!isBackOfficeConnected));
  }, [dispatch, setIsBackOfficeConnected, isBackOfficeConnected]);

  const setOpenStatus = useCallback(() => {
    dispatch(setIsBackOfficeModalOpen(true));
  }, [dispatch, setIsBackOfficeModalOpen]);

  const onClickBackOfficeButton = () => {
    // eslint-disable-next-line no-console
    console.log("BO CONNECTING...");

    setOpenStatus();
    setConnectionStatus();
  };

  if (isExploring || isViewMode) return null;

  return (
    <TooltipComponent
      content={<>{createMessage(EDITOR_HEADER.backOfficeConnect)}</>}
      disabled={appMode !== APP_MODE.EDIT}
      hoverOpenDelay={1000}
      position="bottom"
    >
      <StyledButton
        active={!isBackOfficeConnected}
        category={Category.tertiary}
        data-cy={`${isBackOfficeConnected ? "preview" : "edit"}-mode`}
        icon={"play-circle-line"}
        iconPosition={IconPositions.left}
        onClick={onClickBackOfficeButton}
        size={Size.medium}
        tag={"button"}
        text={createMessage(EDITOR_HEADER.backOfficeConnect).toUpperCase()}
      />
    </TooltipComponent>
  );
}

export default BackOfficeButton;
