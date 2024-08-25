import React from "react";
import { hexToRgba } from "@appsmith/ads-old";
import { Button, Icon, Spinner, Text } from "@appsmith/ads";
import {
  getIsRestartFailed,
  getRestartingState,
} from "selectors/settingsSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import {
  createMessage,
  RETRY_BUTTON,
  RESTART_BANNER_BODY,
  RESTART_BANNER_HEADER,
  RESTART_ERROR_BODY,
  RESTART_ERROR_HEADER,
} from "ee/constants/messages";
import { Colors } from "constants/Colors";
import { retryServerRestart } from "ee/actions/settingsAction";
import { useDispatch } from "react-redux";

const RestartBannerWrapper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  z-index: 20;
  overflow: auto;
`;

const OverlayBackdrop = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  /* TODO: replaced hexToRgba (Albin) */
  background-color: ${hexToRgba(Colors.COD_GRAY, 0.7)};
  overflow: auto;
  pointer-events: none;
  user-select: none;
  z-index: 20;
`;

const RestartContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${(props) => props.theme.settings.footerHeight}px;
  z-index: 20;
  padding: 0px ${(props) => props.theme.spaces[11]}px 0px 276px;
  background: var(--ads-v2-color-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: all;
  user-select: text;
`;

const RestartMessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  pointer-events: none;
`;

const HeaderContents = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[3]}px;
  gap: 8px;
`;

const Heading = styled(Text)``;

const AppIconWrapper = styled.div`
  background: var(--ads-v2-color-bg-error);
  border-radius: 50%;
  padding: 4px;
  margin-right: 12px;

  svg {
    width: 18px;
    height: 18px;

    path {
      fill: var(--ads-v2-color-fg-on-error);
    }
  }
`;

function Header() {
  const isRestartFailed = useSelector(getIsRestartFailed);
  return (
    <HeaderContents>
      {isRestartFailed ? (
        <AppIconWrapper>
          <Icon name="server-line" />
        </AppIconWrapper>
      ) : (
        <Spinner
          iconProps={{ color: "var(--ads-v2-color-bg-brand)" }}
          size="lg"
        />
      )}
      <Heading kind="heading-m" renderAs="p">
        {isRestartFailed
          ? createMessage(RESTART_ERROR_HEADER)
          : createMessage(RESTART_BANNER_HEADER)}
      </Heading>
    </HeaderContents>
  );
}

export default function RestartBanner() {
  const isRestartFailed = useSelector(getIsRestartFailed);
  const isRestarting = useSelector(getRestartingState);
  const dispatch = useDispatch();
  return isRestarting ? (
    <RestartBannerWrapper className="t--admin-settings-restart-notice">
      <OverlayBackdrop />
      <RestartContainer>
        <RestartMessageWrapper>
          <Header />
          <Text renderAs="p">
            {isRestartFailed
              ? createMessage(RESTART_ERROR_BODY)
              : createMessage(RESTART_BANNER_BODY)}
          </Text>
        </RestartMessageWrapper>
        {isRestartFailed && (
          <Button
            data-testid="btn-refresh"
            onClick={() => dispatch(retryServerRestart())}
            size="md"
          >
            {createMessage(RETRY_BUTTON)}
          </Button>
        )}
      </RestartContainer>
    </RestartBannerWrapper>
  ) : null;
}
