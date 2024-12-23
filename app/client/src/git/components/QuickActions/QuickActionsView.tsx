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
import AutocommitStatusbar from "../Statusbar";
import getPullBtnStatus from "./helpers/getPullButtonStatus";
import noop from "lodash/noop";
import BranchButton from "./BranchButton";

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

interface QuickActionsViewProps {
  currentBranch: string | null;
  discard: () => void;
  isAutocommitEnabled: boolean;
  isAutocommitPolling: boolean;
  isBranchPopupOpen: boolean;
  isConnectPermitted: boolean;
  isDiscardLoading: boolean;
  isFetchStatusLoading: boolean;
  isGitConnected: boolean;
  isProtectedMode: boolean;
  isPullFailing: boolean;
  isPullLoading: boolean;
  isStatusClean: boolean;
  isTriggerAutocommitLoading: boolean;
  pull: () => void;
  statusBehindCount: number;
  statusChangeCount: number;
  toggleConnectModal: (open: boolean) => void;
  toggleOpsModal: (open: boolean, tab: keyof typeof GitOpsTab) => void;
  toggleSettingsModal: (
    open: boolean,
    tab: keyof typeof GitSettingsTab,
  ) => void;
  toggleBranchPopup: (open: boolean) => void;
}

function QuickActionsView({
  currentBranch = null,
  discard = noop,
  isAutocommitEnabled = false,
  isAutocommitPolling = false,
  isBranchPopupOpen = false,
  isConnectPermitted = false,
  isDiscardLoading = false,
  isFetchStatusLoading = false,
  isGitConnected = false,
  isProtectedMode = false,
  isPullFailing = false,
  isPullLoading = false,
  isStatusClean = false,
  isTriggerAutocommitLoading = false,
  pull = noop,
  statusBehindCount = 0,
  statusChangeCount = 0,
  toggleBranchPopup = noop,
  toggleConnectModal = noop,
  toggleOpsModal = noop,
  toggleSettingsModal = noop,
}: QuickActionsViewProps) {
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
      toggleOpsModal(true, GitOpsTab.Deploy);

      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_COMMIT_BUTTON",
      });
    }
  }, [isFetchStatusLoading, isProtectedMode, toggleOpsModal]);

  const onPullBtnClick = useCallback(() => {
    if (!isPullButtonLoading && !isPullDisabled) {
      AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
        source: "BOTTOM_BAR_GIT_PULL_BUTTON",
      });

      if (isProtectedMode) {
        discard();
      } else {
        pull();
      }
    }
  }, [discard, isProtectedMode, pull, isPullDisabled, isPullButtonLoading]);

  const onMergeBtnClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
      source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
    });
    toggleOpsModal(true, GitOpsTab.Merge);
  }, [toggleOpsModal]);

  const onSettingsClick = useCallback(() => {
    toggleSettingsModal(true, GitSettingsTab.General);
    AnalyticsUtil.logEvent("GS_SETTING_CLICK", {
      source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
    });
  }, [toggleSettingsModal]);

  const onConnectBtnClick = useCallback(() => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "BOTTOM_BAR_GIT_CONNECT_BUTTON",
    });

    toggleConnectModal(true);
  }, [toggleConnectModal]);

  return isGitConnected ? (
    <Container>
      <BranchButton
        currentBranch={currentBranch}
        isAutocommitPolling={isAutocommitPolling}
        isBranchPopupOpen={isBranchPopupOpen}
        isProtectedMode={isProtectedMode}
        isStatusClean={isStatusClean}
        isTriggerAutocommitLoading={isTriggerAutocommitLoading}
        toggleBranchPopup={toggleBranchPopup}
      />

      {isAutocommitEnabled && isAutocommitPolling ? (
        <AutocommitStatusbar completed={!isAutocommitPolling} />
      ) : (
        <>
          <QuickActionButton
            className="t--bottom-bar-commit"
            count={isProtectedMode ? undefined : statusChangeCount}
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

export default QuickActionsView;
