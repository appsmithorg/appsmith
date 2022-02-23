import React from "react";
import Dialog from "components/ads/DialogComponent";
import { IconSize } from "components/ads/Icon";
import Spinner from "components/ads/Spinner";
import { Layers } from "constants/Layers";
import {
  getIsRestartFailed,
  getRestartingState,
} from "selectors/settingsSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import {
  createMessage,
  RESTART_BANNER_BODY,
  RESTART_BANNER_HEADER,
  RESTART_ERROR_BODY,
  RESTART_ERROR_HEADER,
} from "@appsmith/constants/messages";

const HeaderContents = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: ${(props) => props.theme.spaces[3]}px;
`;

const Heading = styled.div`
  color: ${(props) => props.theme.colors.modal.headerText};
  display: flex;
  justify-content: center;
  align-items: baseline;
  font-weight: ${(props) => props.theme.typography.h1.fontWeight};
  font-size: ${(props) => props.theme.typography.h1.fontSize}px;
  line-height: ${(props) => props.theme.typography.h1.lineHeight}px;
  letter-spacing: ${(props) => props.theme.typography.h1.letterSpacing};
`;

const RestartMessage = styled.p`
  text-align: center;
`;

const StyledSpinner = styled.span`
  margin-left: 10px;
`;

function Header() {
  const isRestartFailed = useSelector(getIsRestartFailed);
  return (
    <HeaderContents>
      <Heading>
        <span>
          {isRestartFailed
            ? createMessage(RESTART_ERROR_HEADER)
            : createMessage(RESTART_BANNER_HEADER)}
        </span>
        {!isRestartFailed && (
          <StyledSpinner>
            <Spinner size={IconSize.LARGE} />
          </StyledSpinner>
        )}
      </Heading>
    </HeaderContents>
  );
}

export default function RestartBanner() {
  const isRestartFailed = useSelector(getIsRestartFailed);
  const isRestarting = useSelector(getRestartingState);
  return isRestarting ? (
    <Dialog
      canEscapeKeyClose={false}
      canOutsideClickClose={false}
      className="t--admin-settings-restart-notice"
      getHeader={() => <Header />}
      isOpen
      showHeaderUnderline
      triggerZIndex={Layers.productUpdates}
      width="292px"
    >
      <RestartMessage>
        {isRestartFailed
          ? createMessage(RESTART_ERROR_BODY)
          : createMessage(RESTART_BANNER_BODY)}
      </RestartMessage>
    </Dialog>
  ) : null;
}
