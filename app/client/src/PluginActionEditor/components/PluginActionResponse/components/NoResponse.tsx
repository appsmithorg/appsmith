import NoResponseSVG from "assets/images/no-response.svg";
import { Text, TextType } from "@appsmith/ads-old";
import { EMPTY_RESPONSE_RUN } from "ee/constants/messages";
import { Button } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";
import { TAB_BAR_HEIGHT } from "./constants";

const StyledText = styled(Text)`
  &&&& {
    margin-top: 0;
  }
`;

const NoResponseContainer = styled.div`
  width: 100%;
  height: calc(100% - ${TAB_BAR_HEIGHT}px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 24px;
`;

const RunGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

interface NoResponseProps {
  isRunDisabled: boolean;
  isRunning: boolean;
  onRunClick: () => void;
}

export const NoResponse = ({
  isRunDisabled,
  isRunning,
  onRunClick,
}: NoResponseProps) => (
  <NoResponseContainer>
    <img alt="no-response-yet" src={NoResponseSVG} />
    <RunGroup>
      <StyledText type={TextType.P1}>{EMPTY_RESPONSE_RUN()}</StyledText>
      <Button
        isDisabled={isRunDisabled}
        isLoading={isRunning}
        onClick={onRunClick}
        size="sm"
      >
        Run
      </Button>
    </RunGroup>
  </NoResponseContainer>
);
