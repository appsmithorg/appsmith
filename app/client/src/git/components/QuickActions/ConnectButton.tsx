import React, { useMemo } from "react";
import styled from "styled-components";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import { QUICK_ACTIONS } from "git/ee/constants/messages";

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
      return <CenterDiv>{QUICK_ACTIONS.CONNECT_BTN_CONTACT_ADMIN}</CenterDiv>;
    }

    return (
      <>
        <div>{QUICK_ACTIONS.CONNECT_BTN_NOT_LIVE_YET}</div>
        <div>{QUICK_ACTIONS.CONNECT_BTN_COMING_SOON}</div>
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
            {QUICK_ACTIONS.CONNECT_BTN_CTA}
          </Button>
        </Container>
      </Tooltip>
    </OuterContainer>
  );
}

export default ConnectButton;
