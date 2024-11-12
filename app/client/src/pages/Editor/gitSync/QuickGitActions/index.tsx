import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import BranchButton from "./BranchButton";

import {
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  COMING_SOON,
  COMMIT_CHANGES,
  CONFLICTS_FOUND,
  CONNECT_GIT_BETA,
  CONTACT_ADMIN_FOR_GIT,
  createMessage,
  DISCARD_AND_PULL_SUCCESS,
  GIT_SETTINGS,
  MERGE,
  NO_COMMITS_TO_PULL,
  NOT_LIVE_FOR_YOU_YET,
  PULL_CHANGES,
} from "ee/constants/messages";

import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import {
  discardChanges,
  gitPullInit,
  setGitSettingsModalOpenAction,
  setIsGitSyncModalOpen,
} from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import {
  getCountOfChangesToCommit,
  getGitMetadataSelector,
  getGitStatus,
  getIsDiscardInProgress,
  getIsFetchingGitStatus,
  getIsGitConnected,
  getIsPollingAutocommit,
  getIsPullingProgress,
  getPullFailed,
  protectedModeSelector,
} from "selectors/gitSyncSelectors";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { getTypographyByKey } from "@appsmith/ads-old";
import { Button, Icon, Tooltip } from "@appsmith/ads";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import AutocommitStatusbar from "./AutocommitStatusbar";
import { useHasConnectToGitPermission } from "../hooks/gitPermissionHooks";
import { GitSettingsTab } from "reducers/uiReducers/gitSyncReducer";

interface QuickActionButtonProps {
  className?: string;
  count?: number;
  disabled?: boolean;
  icon: string;
  loading?: boolean;
  onClick: () => void;
  tooltipText: string;
}

const SpinnerContainer = styled.div`
  padding: 0 10px;
`;

const QuickActionButtonContainer = styled.button<{ disabled?: boolean }>`
  margin: 0 ${(props) => props.theme.spaces[1]}px;
  display: block;
  position: relative;
  overflow: visible;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};

  .count {
    position: absolute;
    height: ${(props) => props.theme.spaces[7]}px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${Colors.WHITE};
    background-color: var(--ads-v2-color-bg-brand-secondary-emphasis-plus);
    top: ${(props) => -1 * props.theme.spaces[3]}px;
    left: ${(props) => props.theme.spaces[10]}px;
    border-radius: ${(props) => props.theme.spaces[3]}px;
    ${getTypographyByKey("p3")};
    z-index: 1;
    padding: ${(props) => props.theme.spaces[1]}px
      ${(props) => props.theme.spaces[2]}px;
  }
`;

export const capitalizeFirstLetter = (string = " ") => {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};

function QuickActionButton({
  className = "",
  count = 0,
  disabled = false,
  icon,
  loading,
  onClick,
  tooltipText,
}: QuickActionButtonProps) {
  const content = capitalizeFirstLetter(tooltipText);

  return (
    <QuickActionButtonContainer
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {loading ? (
        <SpinnerContainer className="t--loader-quick-git-action">
          <SpinnerLoader size="md" />
        </SpinnerContainer>
      ) : (
        <Tooltip content={content}>
          <div>
            <Button
              isDisabled={disabled}
              isIconButton
              kind="tertiary"
              size="md"
              startIcon={icon}
            />
            {count > 0 && <span className="count">{count}</span>}
          </div>
        </Tooltip>
      )}
    </QuickActionButtonContainer>
  );
}

const getPullBtnStatus = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gitStatus: any,
  pullFailed: boolean,
  isProtected: boolean,
) => {
  const { behindCount, isClean } = gitStatus || {};
  let message = createMessage(NO_COMMITS_TO_PULL);
  let disabled = behindCount === 0;

  if (!isClean && !isProtected) {
    disabled = true;
    message = createMessage(CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES);
  } else if (!isClean && isProtected && behindCount > 0) {
    disabled = false;
    message = createMessage(PULL_CHANGES);
  } else if (pullFailed) {
    message = createMessage(CONFLICTS_FOUND);
  } else if (behindCount > 0) {
    message = createMessage(PULL_CHANGES);
  }

  return {
    disabled,
    message,
  };
};

const getQuickActionButtons = ({
  changesToCommit,
  commit,
  gitStatus,
  isFetchingGitStatus,
  isProtectedMode,
  merge,
  pull,
  pullDisabled,
  pullTooltipMessage,
  settings,
  showPullLoadingState,
}: {
  changesToCommit: number;
  commit: () => void;
  settings: () => void;
  pull: () => void;
  merge: () => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gitStatus: any;
  isFetchingGitStatus: boolean;
  pullDisabled: boolean;
  pullTooltipMessage: string;
  showPullLoadingState: boolean;
  isProtectedMode: boolean;
}) => {
  return [
    {
      className: "t--bottom-bar-commit",
      disabled: !isFetchingGitStatus && isProtectedMode,
      count: isProtectedMode ? undefined : changesToCommit,
      icon: "plus",
      loading: isFetchingGitStatus,
      onClick: () => !isFetchingGitStatus && !isProtectedMode && commit(),
      tooltipText: createMessage(COMMIT_CHANGES),
    },
    {
      className: "t--bottom-bar-pull",
      count: gitStatus?.behindCount,
      icon: "down-arrow-2",
      onClick: () => !showPullLoadingState && !pullDisabled && pull(),
      tooltipText: pullTooltipMessage,
      disabled: !showPullLoadingState && pullDisabled,
      loading: showPullLoadingState,
    },
    {
      className: "t--bottom-bar-merge",
      disabled: isProtectedMode,
      icon: "fork",
      onClick: merge,
      tooltipText: createMessage(MERGE),
    },
    {
      className: "t--bottom-git-settings",
      icon: "settings-v3",
      onClick: settings,
      tooltipText: createMessage(GIT_SETTINGS),
    },
  ];
};

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

const StyledIcon = styled(Icon)`
  cursor: default;
  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

const OuterContainer = styled.div`
  padding: 4px 16px;
  height: 100%;
`;

const CenterDiv = styled.div`
  text-align: center;
`;

function ConnectGitPlaceholder() {
  const dispatch = useDispatch();
  const isConnectToGitPermitted = useHasConnectToGitPermission();

  const isTooltipEnabled = !isConnectToGitPermitted;
  const tooltipContent = useMemo(() => {
    if (!isConnectToGitPermitted) {
      return <CenterDiv>{createMessage(CONTACT_ADMIN_FOR_GIT)}</CenterDiv>;
    }

    return (
      <>
        <div>{createMessage(NOT_LIVE_FOR_YOU_YET)}</div>
        <div>{createMessage(COMING_SOON)}</div>
      </>
    );
  }, [isConnectToGitPermitted]);

  const handleClickOnGitConnect = useCallback(() => {
    AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
      source: "BOTTOM_BAR_GIT_CONNECT_BUTTON",
    });

    dispatch(
      setIsGitSyncModalOpen({
        isOpen: true,
        tab: GitSyncModalTab.GIT_CONNECTION,
      }),
    );
  }, [dispatch]);

  return (
    <OuterContainer>
      <Tooltip content={tooltipContent} isDisabled={!isTooltipEnabled}>
        <Container style={{ marginLeft: 0, cursor: "pointer" }}>
          <StyledIcon
            color="var(--ads-v2-color-fg-muted)"
            name="git-commit"
            size="lg"
          />
          <Button
            className="t--connect-git-bottom-bar"
            isDisabled={!isConnectToGitPermitted}
            kind="secondary"
            onClick={handleClickOnGitConnect}
            size="sm"
          >
            {createMessage(CONNECT_GIT_BETA)}
          </Button>
        </Container>
      </Tooltip>
    </OuterContainer>
  );
}

export default function QuickGitActions() {
  const isGitConnected = useSelector(getIsGitConnected);
  const dispatch = useDispatch();
  const gitStatus = useSelector(getGitStatus);
  const pullFailed = useSelector(getPullFailed);
  const isProtectedMode = useSelector(protectedModeSelector);

  const { disabled: pullDisabled, message: pullTooltipMessage } =
    getPullBtnStatus(gitStatus, !!pullFailed, isProtectedMode);

  const isDiscardInProgress = useSelector(getIsDiscardInProgress);
  const isPullInProgress = useSelector(getIsPullingProgress);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const showPullLoadingState =
    isDiscardInProgress || isPullInProgress || isFetchingGitStatus;
  const changesToCommit = useSelector(getCountOfChangesToCommit);

  const gitMetadata = useSelector(getGitMetadataSelector);
  const isPollingAutocommit = useSelector(getIsPollingAutocommit);
  const isAutocommitEnabled = gitMetadata?.autoCommitConfig?.enabled;

  const quickActionButtons = getQuickActionButtons({
    commit: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.DEPLOY,
        }),
      );
      AnalyticsUtil.logEvent("GS_DEPLOY_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_COMMIT_BUTTON",
      });
    },
    settings: () => {
      dispatch(
        setGitSettingsModalOpenAction({
          open: true,
          tab: GitSettingsTab.GENERAL,
        }),
      );
      AnalyticsUtil.logEvent("GS_SETTING_CLICK", {
        source: "BOTTOM_BAR_GIT_SETTING_BUTTON",
      });
    },
    pull: () => {
      AnalyticsUtil.logEvent("GS_PULL_GIT_CLICK", {
        source: "BOTTOM_BAR_GIT_PULL_BUTTON",
      });

      if (isProtectedMode) {
        dispatch(
          discardChanges({
            successToastMessage: createMessage(DISCARD_AND_PULL_SUCCESS),
          }),
        );
      } else {
        dispatch(gitPullInit({ triggeredFromBottomBar: true }));
      }
    },
    merge: () => {
      AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
      });
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.MERGE,
          isDeploying: true,
        }),
      );
    },
    gitStatus,
    isFetchingGitStatus,
    pullDisabled,
    pullTooltipMessage,
    showPullLoadingState,
    changesToCommit,
    isProtectedMode,
  });

  return isGitConnected ? (
    <Container>
      <BranchButton />
      {isAutocommitEnabled && isPollingAutocommit ? (
        <AutocommitStatusbar completed={!isPollingAutocommit} />
      ) : (
        quickActionButtons.map((button) => (
          <QuickActionButton key={button.tooltipText} {...button} />
        ))
      )}
    </Container>
  ) : (
    <ConnectGitPlaceholder />
  );
}
