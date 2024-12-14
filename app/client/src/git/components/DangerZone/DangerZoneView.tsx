import {
  AUTOCOMMIT,
  AUTOCOMMIT_DISABLE,
  AUTOCOMMIT_ENABLE,
  AUTOCOMMIT_MESSAGE,
  DANGER_ZONE,
  DISCONNECT_GIT,
  DISCONNECT_GIT_MESSAGE,
  createMessage,
} from "ee/constants/messages";
import { Button, Divider, Text } from "@appsmith/ads";
import React, { useCallback } from "react";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import noop from "lodash/noop";
import type { GitSettingsTab } from "git/constants/enums";

const Container = styled.div`
  padding-top: 16px;
  padding-bottom: 16px;
`;

const HeadContainer = styled.div`
  margin-bottom: 16px;
`;

const ZoneContainer = styled.div`
  border: solid 0.4px var(--ads-v2-color-red-600);
  padding: 12px;
  border-radius: 4px;
`;

const BodyContainer = styled.div`
  display: flex;
  align-items: center;
`;

const BodyInnerContainer = styled.div`
  flex: 1;
  margin-right: 32px;
`;

const SectionTitle = styled(Text)`
  font-weight: 600;
`;

const StyledDivider = styled(Divider)`
  display: block;
  margin-top: 16px;
  margin-bottom: 16px;
`;

interface DangerZoneViewProps {
  closeDisconnectModal: () => void;
  isConnectPermitted: boolean;
  isManageAutocommitPermitted: boolean;
  isToggleAutocommitLoading: boolean;
  isAutocommitEnabled: boolean;
  isFetchMetadataLoading: boolean;
  openDisconnectModal: () => void;
  toggleAutocommit: () => void;
  toggleDisableAutocommitModal: (open: boolean) => void;
  toggleSettingsModal: (
    open: boolean,
    tab?: keyof typeof GitSettingsTab,
  ) => void;
}

function DangerZoneView({
  isAutocommitEnabled = false,
  isConnectPermitted = false,
  isFetchMetadataLoading = false,
  isManageAutocommitPermitted = false,
  isToggleAutocommitLoading = false,
  openDisconnectModal = noop,
  toggleAutocommit = noop,
  toggleDisableAutocommitModal = noop,
  toggleSettingsModal = noop,
}: DangerZoneViewProps) {
  const handleDisconnect = useCallback(() => {
    AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
      source: "GIT_CONNECTION_MODAL",
    });
    toggleSettingsModal(false);
    openDisconnectModal();
  }, [openDisconnectModal, toggleSettingsModal]);

  const handleToggleAutocommit = useCallback(() => {
    if (isAutocommitEnabled) {
      toggleSettingsModal(false);
      toggleDisableAutocommitModal(true);
    } else {
      toggleAutocommit();
      AnalyticsUtil.logEvent("GS_AUTO_COMMIT_ENABLED");
    }
  }, [
    isAutocommitEnabled,
    toggleAutocommit,
    toggleDisableAutocommitModal,
    toggleSettingsModal,
  ]);

  const showAutoCommit = isManageAutocommitPermitted;
  const showDisconnect = isConnectPermitted;
  const showDivider = showAutoCommit && showDisconnect;

  return (
    <Container>
      <HeadContainer>
        <SectionTitle kind="heading-s">
          {createMessage(DANGER_ZONE)}
        </SectionTitle>
      </HeadContainer>
      <ZoneContainer>
        {showAutoCommit && (
          <BodyContainer>
            <BodyInnerContainer>
              <Text kind="heading-xs" renderAs="p">
                {createMessage(AUTOCOMMIT)}
              </Text>
              <Text renderAs="p">{createMessage(AUTOCOMMIT_MESSAGE)}</Text>
            </BodyInnerContainer>
            <Button
              data-testid="t--git-autocommit-btn"
              isLoading={isToggleAutocommitLoading || isFetchMetadataLoading}
              kind={isAutocommitEnabled ? "error" : "secondary"}
              onClick={handleToggleAutocommit}
              size="md"
            >
              {isAutocommitEnabled
                ? createMessage(AUTOCOMMIT_DISABLE)
                : createMessage(AUTOCOMMIT_ENABLE)}
            </Button>
          </BodyContainer>
        )}
        {showDivider && <StyledDivider />}
        {showDisconnect && (
          <BodyContainer>
            <BodyInnerContainer>
              <Text kind="heading-xs" renderAs="p">
                {createMessage(DISCONNECT_GIT)}
              </Text>
              <Text renderAs="p">{createMessage(DISCONNECT_GIT_MESSAGE)}</Text>
            </BodyInnerContainer>
            <Button
              data-testid="t--git-disconnect-btn"
              kind="error"
              onClick={handleDisconnect}
              size="md"
            >
              {createMessage(DISCONNECT_GIT)}
            </Button>
          </BodyContainer>
        )}
      </ZoneContainer>
    </Container>
  );
}

export default DangerZoneView;
