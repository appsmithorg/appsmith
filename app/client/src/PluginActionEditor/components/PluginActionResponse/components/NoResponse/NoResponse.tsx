import React from "react";

import { Button } from "@appsmith/ads";
import NoResponseSVG from "assets/images/no-response.svg";
import { EMPTY_RESPONSE_RUN } from "ee/constants/messages";

import * as Styled from "./styles";

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
  <Styled.Container>
    <img alt="no-response-yet" src={NoResponseSVG} />
    <Styled.RunGroup>
      <Styled.Text>{EMPTY_RESPONSE_RUN()}</Styled.Text>
      <Button
        isDisabled={isRunDisabled}
        isLoading={isRunning}
        onClick={onRunClick}
        size="sm"
      >
        Run
      </Button>
    </Styled.RunGroup>
  </Styled.Container>
);
