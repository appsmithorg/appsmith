import React, { useCallback } from "react";
import styled from "styled-components";

import {
  COMMIT_CHANGES,
  createMessage,
  GIT_SETTINGS,
  MERGE,
} from "ee/constants/messages";

import { GitSyncModalTab } from "entities/GitSync";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { GitMetadata, GitStatus } from "../../types";
import { getPullBtnStatus } from "./helpers";
import { GitSettingsTab } from "../../constants/enums";
import ConnectButton from "./ConnectButton";
import QuickActionButton from "./QuickActionButton";
import AutocommitStatusbar from "./AutocommitStatusbar";

interface QuickActionsProps {
  isGitConnected: boolean;
  gitStatus: GitStatus;
  pullFailed: boolean;
  isProtectedMode: boolean;
  isDiscardInProgress: boolean;
  isPollingAutocommit: boolean;
  isPullInProgress: boolean;
  isFetchingGitStatus: boolean;
  changesToCommit: number;
  gitMetadata: GitMetadata;
  isAutocommitEnabled: boolean;
  isConnectPermitted: boolean;
  openGitSyncModal: (options: {
    tab: GitSyncModalTab;
    isDeploying?: boolean;
  }) => void;
  openGitSettingsModal: (options: { tab: GitSettingsTab }) => void;
  discardChanges: () => void;
  pull: (options: { triggeredFromBottomBar: boolean }) => void;
}

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

function QuickActions({
  changesToCommit,
  discardChanges,
  gitMetadata,
  gitStatus,
  isConnectPermitted,
  isDiscardInProgress,
  isFetchingGitStatus,
  isGitConnected,
  isPollingAutocommit,
  isProtectedMode,
  isPullInProgress,
  openGitSettingsModal,
  openGitSyncModal,
  pull,
  pullFailed,
}: QuickActionsProps) {
  const { disabled: pullDisabled, message: pullTooltipMessage } =
    getPullBtnStatus(gitStatus, !!pullFailed, isProtectedMode);

  const showPullLoadingState =
    isDiscardInProgress || isPullInProgress || isFetchingGitStatus;

  // TODO - Update once the gitMetadata typing is added
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const isAutocommitEnabled: boolean = gitMetadata?.autoCommitConfig?.enabled;
  const onCommitClick = useCallback(() => {
    if (!isFetchingGitStatus && !isProtectedMode) {
      openGitSyncModal({
        tab: GitSyncModalTab.DEPLOY,
      });

      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_COMMIT_BUTTON",
      });
    }
  }, [isFetchingGitStatus, isProtectedMode, openGitSyncModal]);

  const onPullClick = useCallback(() => {
    if (!showPullLoadingState && !pullDisabled) {
      AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
        source: "BOTTOM_BAR_GIT_PULL_BUTTON",
      });

      if (isProtectedMode) {
        discardChanges();
      } else {
        pull({ triggeredFromBottomBar: true });
      }
    }
  }, [
    discardChanges,
    isProtectedMode,
    pull,
    pullDisabled,
    showPullLoadingState,
  ]);

  const onMerge = useCallback(() => {
    AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
      source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
    });
    openGitSyncModal({
      tab: GitSyncModalTab.MERGE,
      isDeploying: true,
    });
  }, [openGitSyncModal]);

  const onSettingsClick = useCallback(() => {
    openGitSettingsModal({
      tab: GitSettingsTab.General,
    });
    AnalyticsUtil.logEvent("GS_SETTING_CLICK", {
      source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
    });
  }, [openGitSettingsModal]);

  return isGitConnected ? (
    <Container>
      {/* <BranchButton /> */}
      {isAutocommitEnabled && isPollingAutocommit ? (
        <AutocommitStatusbar completed={!isPollingAutocommit} />
      ) : (
        <>
          <QuickActionButton
            className="t--bottom-bar-commit"
            count={isProtectedMode ? undefined : changesToCommit}
            disabled={!isFetchingGitStatus && isProtectedMode}
            icon="plus"
            key="commit-action-btn"
            loading={isFetchingGitStatus}
            onClick={onCommitClick}
            tooltipText={createMessage(COMMIT_CHANGES)}
          />
          <QuickActionButton
            actionName="pull"
            className="t--bottom-bar-pull"
            // TODO: Remove this when gitStatus typings are finalized
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            //@ts-ignore
            count={gitStatus?.behindCount}
            disabled={!showPullLoadingState && pullDisabled}
            icon="down-arrow-2"
            key="pull-action-btn"
            loading={showPullLoadingState}
            onClick={onPullClick}
            tooltipText={pullTooltipMessage}
          />
          <QuickActionButton
            className="t--bottom-bar-merge"
            disabled={isProtectedMode}
            icon="fork"
            key="merge-action-btn"
            onClick={onMerge}
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
      openGitSyncModal={openGitSyncModal}
    />
  );
}

export default QuickActions;
