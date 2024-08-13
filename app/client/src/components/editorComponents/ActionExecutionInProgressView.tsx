import React from "react";
import {
  ACTION_EXECUTION_CANCEL,
  ACTION_EXECUTION_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import ActionAPI from "api/ActionAPI";
import { Button, Spinner, Text } from "@appsmith/ads";
import styled from "styled-components";
import type { EditorTheme } from "./CodeEditor/EditorConfig";
import LoadingOverlayScreen from "./LoadingOverlayScreen";

const Wrapper = styled.div`
  position: relative;
  height: 100%;
  width: 100%;
`;

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

const InProgressText = styled(Text)`
  text-align: center;
`;

const handleCancelActionExecution = () => {
  ActionAPI.abortActionExecutionTokenSource.cancel();
};

interface ActionExecutionInProgressViewProps {
  actionType: string;
  theme?: EditorTheme;
}

const ActionExecutionInProgressView = ({
  actionType,
  theme,
}: ActionExecutionInProgressViewProps) => {
  return (
    <Wrapper>
      <LoadingProgressWrapper>
        <LoadingOverlayScreen theme={theme} />
        <LoadingOverlayContainer>
          <Spinner size="md" />
          <InProgressText kind="body-m" renderAs="p">
            {createMessage(ACTION_EXECUTION_MESSAGE, actionType)}
          </InProgressText>
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
    </Wrapper>
  );
};

export default ActionExecutionInProgressView;
