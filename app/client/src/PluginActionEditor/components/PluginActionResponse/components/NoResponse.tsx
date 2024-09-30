import NoResponseSVG from "assets/images/no-response.svg";
import { Classes, Text, TextType } from "@appsmith/ads-old";
import {
  EMPTY_RESPONSE_FIRST_HALF,
  EMPTY_RESPONSE_LAST_HALF,
} from "ee/constants/messages";
import { Button } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

const StyledText = styled(Text)`
  &&&& {
    margin-top: 0;
  }
`;

const NoResponseContainer = styled.div`
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  .${Classes.ICON} {
    margin-right: 0;

    svg {
      width: 150px;
      height: 150px;
    }
  }

  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
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
    <div className="flex gap-2 items-center mt-4">
      <StyledText type={TextType.P1}>{EMPTY_RESPONSE_FIRST_HALF()}</StyledText>
      <Button
        isDisabled={isRunDisabled}
        isLoading={isRunning}
        onClick={onRunClick}
        size="sm"
      >
        Run
      </Button>
      <StyledText type={TextType.P1}>{EMPTY_RESPONSE_LAST_HALF()}</StyledText>
    </div>
  </NoResponseContainer>
);
