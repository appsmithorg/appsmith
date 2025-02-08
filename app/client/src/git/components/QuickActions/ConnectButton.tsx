import React, { useMemo } from "react";
import styled from "styled-components";
import {
  COMING_SOON,
  CONNECT_GIT_BETA,
  CONTACT_ADMIN_FOR_GIT,
  createMessage,
  NOT_LIVE_FOR_YOU_YET,
} from "ee/constants/messages";

import { Button, Icon, Tooltip } from "@appsmith/ads";

const CenterDiv = styled.div`
  text-align: center;
`;

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  margin-left: 0;
  cursor: pointer;
`;

const StyledIcon = styled(Icon)`
  cursor: default;
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

const OuterContainer = styled.div`
  padding: 4px 16px;
  height: 100%;
`;

interface ConnectButtonProps {
  isConnectPermitted: boolean;
  onClick: () => void;
}

function ConnectButton({ isConnectPermitted, onClick }: ConnectButtonProps) {
  const isTooltipEnabled = !isConnectPermitted;
  const tooltipContent = useMemo(() => {
    if (!isConnectPermitted) {
      return <CenterDiv>{createMessage(CONTACT_ADMIN_FOR_GIT)}</CenterDiv>;
    }

    return (
      <>
        <div>{createMessage(NOT_LIVE_FOR_YOU_YET)}</div>
        <div>{createMessage(COMING_SOON)}</div>
      </>
    );
  }, [isConnectPermitted]);

  return (
    <OuterContainer>
      <Tooltip content={tooltipContent} isDisabled={!isTooltipEnabled}>
        <Container>
          <StyledIcon
            color="var(--ads-v2-color-fg-muted)"
            name="git-commit"
            size="lg"
          />
          <Button
            data-testid="t--git-quick-actions-connect"
            isDisabled={!isConnectPermitted}
            kind="secondary"
            onClick={onClick}
            size="sm"
          >
            {createMessage(CONNECT_GIT_BETA)}
          </Button>
        </Container>
      </Tooltip>
    </OuterContainer>
  );
}

export default ConnectButton;
