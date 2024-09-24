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
import {
  setDisconnectingGitApplication,
  toggleAutocommitEnabledInit,
  setIsAutocommitModalOpen,
  setIsDisconnectGitModalOpen,
  setGitSettingsModalOpenAction,
} from "actions/gitSyncActions";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { Button, Divider, Text } from "@appsmith/ads";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAutocommitEnabledSelector,
  getGitMetadataLoadingSelector,
  getIsAutocommitToggling,
} from "selectors/gitSyncSelectors";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import {
  useHasConnectToGitPermission,
  useHasManageAutoCommitPermission,
} from "../../hooks/gitPermissionHooks";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";

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

function DangerZone() {
  const isConnectToGitPermitted = useHasConnectToGitPermission();
  const isManageAutoCommitPermitted = useHasManageAutoCommitPermission();
  const isAutocommitFeatureEnabled = useFeatureFlag(
    FEATURE_FLAG.release_git_autocommit_feature_enabled,
  );
  const isAutocommitToggling = useSelector(getIsAutocommitToggling);
  const isAutocommitEnabled = useSelector(getAutocommitEnabledSelector);
  const gitMetadataLoading = useSelector(getGitMetadataLoadingSelector);

  const dispatch = useDispatch();

  const currentApp = useSelector(getCurrentApplication);

  const handleDisconnect = () => {
    AnalyticsUtil.logEvent("GS_DISCONNECT_GIT_CLICK", {
      source: "GIT_CONNECTION_MODAL",
    });
    dispatch(setGitSettingsModalOpenAction({ open: false }));
    dispatch(
      setDisconnectingGitApplication({
        id: currentApp?.id || "",
        name: currentApp?.name || "",
      }),
    );
    dispatch(setIsDisconnectGitModalOpen(true));
  };

  const handleToggleAutocommit = () => {
    if (isAutocommitEnabled) {
      dispatch(setGitSettingsModalOpenAction({ open: false }));
      dispatch(setIsAutocommitModalOpen(true));
    } else {
      dispatch(toggleAutocommitEnabledInit());
      AnalyticsUtil.logEvent("GS_AUTO_COMMIT_ENABLED");
    }
  };

  const showAutoCommit =
    isAutocommitFeatureEnabled && isManageAutoCommitPermitted;
  const showDisconnect = isConnectToGitPermitted;
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
              data-testid="t--git-disconnect-btn"
              isLoading={isAutocommitToggling || gitMetadataLoading}
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
        {isConnectToGitPermitted && (
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

export default DangerZone;
