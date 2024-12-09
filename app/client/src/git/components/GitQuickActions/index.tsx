import React, { useCallback } from "react";
import styled from "styled-components";

import {
  COMMIT_CHANGES,
  createMessage,
  GIT_SETTINGS,
  MERGE,
} from "ee/constants/messages";

import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { GitOpsTab } from "../../constants/enums";
import { GitSettingsTab } from "../../constants/enums";
import ConnectButton from "./ConnectButton";
import QuickActionButton from "./QuickActionButton";
import AutocommitStatusbar from "./AutocommitStatusbar";
import getPullBtnStatus from "./helpers/getPullButtonStatus";
import noop from "lodash/noop";
import type {
  ToggleGitConnectModalPayload,
  ToggleGitOpsModalPayload,
  ToggleGitSettingsModalPayload,
} from "git/store/actions/uiActions";

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

interface GitQuickActionsProps {
  discard: () => void;
  isAutocommitEnabled: boolean;
  isAutocommitPolling: boolean;
  isConnectPermitted: boolean;
  isDiscardLoading: boolean;
  isFetchStatusLoading: boolean;
  isGitConnected: boolean;
  isProtectedMode: boolean;
  isPullFailing: boolean;
  isPullLoading: boolean;
  isStatusClean: boolean;
  pull: () => void;
  statusBehindCount: number;
  statusChangesCount: number;
  toggleGitConnectModal: (params: ToggleGitConnectModalPayload) => void;
  toggleGitOpsModal: (params: ToggleGitOpsModalPayload) => void;
  toggleGitSettingsModal: (params: ToggleGitSettingsModalPayload) => void;
}

function GitQuickActions({
  discard = noop,
  isAutocommitEnabled = false,
  isAutocommitPolling = false,
  isConnectPermitted = false,
  isDiscardLoading = false,
  isFetchStatusLoading = false,
  isGitConnected = false,
  isProtectedMode = false,
  isPullFailing = false,
  isPullLoading = false,
  isStatusClean = false,
  pull = noop,
  statusBehindCount = 0,
  statusChangesCount = 0,
  toggleGitConnectModal = noop,
  toggleGitOpsModal = noop,
  toggleGitSettingsModal = noop,
}: GitQuickActionsProps) {
  const { isDisabled: isPullDisabled, message: pullTooltipMessage } =
    getPullBtnStatus({
      isStatusClean,
      isProtectedMode,
      isPullFailing,
      statusBehindCount,
    });

  const isPullButtonLoading =
    isDiscardLoading || isPullLoading || isFetchStatusLoading;

  const onCommitBtnClick = useCallback(() => {
    if (!isFetchStatusLoading && !isProtectedMode) {
      toggleGitOpsModal({
        open: true,
        tab: GitOpsTab.Deploy,
      });

      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_COMMIT_BUTTON",
      });
    }
  }, [isFetchStatusLoading, isProtectedMode, toggleGitOpsModal]);

  const onPullBtnClick = useCallback(() => {
    if (!isPullButtonLoading && !isPullDisabled) {
      AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
        source: "BOTTOM_BAR_GIT_PULL_BUTTON",
      });

      if (isProtectedMode) {
        discard();
      } else {
        // pull({ triggeredFromBottomBar: true });
        pull();
      }
    }
  }, [discard, isProtectedMode, pull, isPullDisabled, isPullButtonLoading]);

  const onMergeBtnClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
      source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
    });
    toggleGitOpsModal({
      open: true,
      tab: GitOpsTab.Merge,
    });
  }, [toggleGitOpsModal]);

  const onSettingsClick = useCallback(() => {
    toggleGitSettingsModal({
      open: true,
      tab: GitSettingsTab.General,
    });
    AnalyticsUtil.logEvent("GS_SETTING_CLICK", {
      source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
    });
  }, [toggleGitSettingsModal]);

  const onConnectBtnClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "BOTTOM_BAR_GIT_CONNECT_BUTTON",
    });

    toggleGitConnectModal({
      open: true,
    });
  }, [toggleGitConnectModal]);

  return isGitConnected ? (
    <Container>
      {/* <BranchButton /> */}
      {isAutocommitEnabled && isAutocommitPolling ? (
        <AutocommitStatusbar completed={!isAutocommitPolling} />
      ) : (
        <>
          <QuickActionButton
            className="t--bottom-bar-commit"
            count={isProtectedMode ? undefined : statusChangesCount}
            disabled={!isFetchStatusLoading && isProtectedMode}
            icon="plus"
            key="commit-action-btn"
            loading={isFetchStatusLoading}
            onClick={onCommitBtnClick}
            tooltipText={createMessage(COMMIT_CHANGES)}
          />
          <QuickActionButton
            className="t--bottom-bar-pull"
            count={statusBehindCount}
            disabled={!isPullButtonLoading && isPullDisabled}
            icon="down-arrow-2"
            key="pull-action-btn"
            loading={isPullButtonLoading}
            onClick={onPullBtnClick}
            tooltipText={pullTooltipMessage}
          />
          <QuickActionButton
            className="t--bottom-bar-merge"
            disabled={isProtectedMode}
            icon="fork"
            key="merge-action-btn"
            onClick={onMergeBtnClick}
            tooltipText={createMessage(MERGE)}
          />
          <QuickActionButton
            className="t--bottom-git-settings"
            icon="settings-v3"
            key="settings-action-btn"
            onClick={onSettingsClick}
            tooltipText={createMessage(GIT_SETTINGS)}
          />
        </>
      )}
    </Container>
  ) : (
    <ConnectButton
      isConnectPermitted={isConnectPermitted}
      onClick={onConnectBtnClick}
    />
  );
}

export default GitQuickActions;
