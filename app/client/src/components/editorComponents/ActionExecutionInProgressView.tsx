import React from "react";
import {
  ACTION_EXECUTION_CANCEL,
  ACTION_EXECUTION_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import ActionAPI from "api/ActionAPI";
import { Button } from "design-system";
import { TextType, Text } from "design-system-old";
import styled from "styled-components";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import LoadingOverlayScreen from "./LoadingOverlayScreen";

const LoadingOverlayContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
  background-color: transparent;
  position: relative;
  z-index: 20;
  width: 100%;
  height: 100%;
  margin-top: 5px;
`;

const LoadingProgressWrapper = styled.div`
  height: 100%;
`;

const handleCancelActionExecution = () => {
  ActionAPI.abortActionExecutionTokenSource.cancel();
};

type ActionExecutionInProgressViewProps = {
  actionType: string;
  theme?: EditorTheme;
};

const ActionExecutionInProgressView = ({
  actionType,
  theme,
}: ActionExecutionInProgressViewProps) => {
  return (
    <LoadingProgressWrapper>
      <LoadingOverlayScreen theme={theme} />
      <LoadingOverlayContainer>
        <Text textAlign="center" type={TextType.P1}>
          {createMessage(ACTION_EXECUTION_MESSAGE, actionType)}
        </Text>
        <Button
          className={`t--cancel-action-button`}
          kind="secondary"
          onClick={() => {
            handleCancelActionExecution();
          }}
          size="md"
        >
          {createMessage(ACTION_EXECUTION_CANCEL)}
        </Button>
      </LoadingOverlayContainer>
    </LoadingProgressWrapper>
  );
};

export default ActionExecutionInProgressView;
