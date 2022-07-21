import React from "react";
import styled from "styled-components";

import BranchButton from "./BranchButton";

import {
  CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES,
  COMING_SOON,
  COMMIT_CHANGES,
  CONFLICTS_FOUND,
  CONNECT_GIT,
  CONNECT_GIT_BETA,
  CONNECTING_TO_REPO_DISABLED,
  createMessage,
  DURING_ONBOARDING_TOUR,
  GIT_SETTINGS,
  MERGE,
  NO_COMMITS_TO_PULL,
  NOT_LIVE_FOR_YOU_YET,
  PULL_CHANGES,
} from "@appsmith/constants/messages";

import { TooltipComponent as Tooltip } from "design-system";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { ReactComponent as GitCommitLine } from "assets/icons/ads/git-commit-line.svg";
import Button, { Category, Size } from "components/ads/Button";
import {
  gitPullInit,
  setIsGitSyncModalOpen,
  showConnectGitModal,
} from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import {
  getCountOfChangesToCommit,
  getGitStatus,
  getIsFetchingGitStatus,
  getIsGitConnected,
  getPullFailed,
  getPullInProgress,
} from "selectors/gitSyncSelectors";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { inGuidedTour } from "selectors/onboardingSelectors";
import Icon, { IconName, IconSize } from "components/ads/Icon";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { selectFeatureFlags } from "selectors/usersSelectors";

type QuickActionButtonProps = {
  className?: string;
  count?: number;
  disabled?: boolean;
  icon: IconName;
  loading?: boolean;
  onClick: () => void;
  tooltipText: string;
};

const QuickActionButtonContainer = styled.div<{ disabled?: boolean }>`
  padding: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[2]}px;
  margin: 0 ${(props) => props.theme.spaces[2]}px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

  &:hover {
    background-color: ${(props) =>
      props.theme.colors.editorBottomBar.buttonBackgroundHover};
  }

  position: relative;
  overflow: visible;

  .count {
    position: absolute;
    height: ${(props) => props.theme.spaces[7]}px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${Colors.WHITE};
    background-color: ${Colors.BLACK};
    top: ${(props) => -1 * props.theme.spaces[3]}px;
    left: ${(props) => props.theme.spaces[8]}px;
    border-radius: ${(props) => props.theme.spaces[3]}px;
    ${(props) => getTypographyByKey(props, "p3")};
    z-index: 1;
    padding: ${(props) => props.theme.spaces[1]}px
      ${(props) => props.theme.spaces[2]}px;
  }
`;

const capitalizeFirstLetter = (string = " ") => {
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
    <Tooltip content={content} hoverOpenDelay={10}>
      <QuickActionButtonContainer
        className={className}
        disabled={disabled}
        onClick={onClick}
      >
        {loading ? (
          <div className="t--loader-quick-git-action">
            <SpinnerLoader height="16px" width="16px" />
          </div>
        ) : (
          <div>
            <Icon name={icon} size={IconSize.XL} />
            {count > 0 && <span className="count">{count}</span>}
          </div>
        )}
      </QuickActionButtonContainer>
    </Tooltip>
  );
}

const getPullBtnStatus = (gitStatus: any, pullFailed: boolean) => {
  const { behindCount, isClean } = gitStatus || {};
  let message = createMessage(NO_COMMITS_TO_PULL);
  let disabled = behindCount === 0;
  if (!isClean) {
    disabled = true;
    message = createMessage(CANNOT_PULL_WITH_LOCAL_UNCOMMITTED_CHANGES);
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
  connect,
  gitStatus,
  isFetchingGitStatus,
  merge,
  pull,
  pullDisabled,
  pullTooltipMessage,
  showPullLoadingState,
}: {
  changesToCommit: number;
  commit: () => void;
  connect: () => void;
  pull: () => void;
  merge: () => void;
  gitStatus: any;
  isFetchingGitStatus: boolean;
  pullDisabled: boolean;
  pullTooltipMessage: string;
  showPullLoadingState: boolean;
}) => {
  return [
    {
      className: "t--bottom-bar-commit",
      count: changesToCommit,
      icon: "plus" as IconName,
      loading: isFetchingGitStatus,
      onClick: commit,
      tooltipText: createMessage(COMMIT_CHANGES),
    },
    {
      className: "t--bottom-bar-pull",
      count: gitStatus?.behindCount,
      icon: "down-arrow-2" as IconName,
      onClick: () => !pullDisabled && pull(),
      tooltipText: pullTooltipMessage,
      disabled: pullDisabled,
      loading: showPullLoadingState,
    },
    {
      className: "t--bottom-bar-merge",
      icon: "fork" as IconName,
      onClick: merge,
      tooltipText: createMessage(MERGE),
    },
    {
      icon: "settings-2-line" as IconName,
      onClick: connect,
      tooltipText: createMessage(GIT_SETTINGS),
    },
  ];
};

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

const StyledIcon = styled(GitCommitLine)`
  cursor: default;

  & path {
    fill: ${Colors.DARK_GRAY};
  }

  margin-right: ${(props) => props.theme.spaces[3]}px;
`;

const PlaceholderButton = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[1]}px ${props.theme.spaces[3]}px`};
  border: solid 1px ${Colors.MERCURY};
  ${(props) => getTypographyByKey(props, "btnSmall")};
  text-transform: uppercase;
  background-color: ${Colors.ALABASTER_ALT};
  color: ${Colors.GRAY};
`;

function ConnectGitPlaceholder() {
  const dispatch = useDispatch();
  const isInGuidedTour = useSelector(inGuidedTour);
  const featureFlags = useSelector(selectFeatureFlags);

  const isTooltipEnabled = !featureFlags.GIT || isInGuidedTour;
  const tooltipContent = !isInGuidedTour ? (
    <>
      <div>{createMessage(NOT_LIVE_FOR_YOU_YET)}</div>
      <div>{createMessage(COMING_SOON)}</div>
    </>
  ) : (
    <>
      <div>{createMessage(CONNECTING_TO_REPO_DISABLED)}</div>
      <div>{createMessage(DURING_ONBOARDING_TOUR)}</div>
    </>
  );
  const isGitConnectionEnabled = featureFlags.GIT && !isInGuidedTour;

  return (
    <Container>
      <Tooltip
        autoFocus={false}
        content={tooltipContent}
        disabled={!isTooltipEnabled}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
        openOnTargetFocus={false}
      >
        <Container style={{ marginLeft: 0, cursor: "pointer" }}>
          <StyledIcon />
          {isGitConnectionEnabled ? (
            <Button
              category={Category.tertiary}
              className="t--connect-git-bottom-bar"
              onClick={() => {
                AnalyticsUtil.logEvent("GS_CONNECT_GIT_CLICK", {
                  source: "BOTTOM_BAR_GIT_CONNECT_BUTTON",
                });

                dispatch(showConnectGitModal());
              }}
              size={Size.small}
              text={createMessage(CONNECT_GIT_BETA)}
            />
          ) : (
            <PlaceholderButton className="t--disabled-connect-git-bottom-bar">
              {createMessage(CONNECT_GIT)}
            </PlaceholderButton>
          )}
        </Container>
      </Tooltip>
    </Container>
  );
}

export default function QuickGitActions() {
  const isGitConnected = useSelector(getIsGitConnected);
  const dispatch = useDispatch();
  const gitStatus = useSelector(getGitStatus);
  const pullFailed = useSelector(getPullFailed);

  const {
    disabled: pullDisabled,
    message: pullTooltipMessage,
  } = getPullBtnStatus(gitStatus, !!pullFailed);

  const isPullInProgress = useSelector(getPullInProgress);
  const isFetchingGitStatus = useSelector(getIsFetchingGitStatus);
  const showPullLoadingState = isPullInProgress || isFetchingGitStatus;
  const changesToCommit = useSelector(getCountOfChangesToCommit);
  const featureFlags = useSelector(selectFeatureFlags);

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
    connect: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.GIT_CONNECTION,
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
      dispatch(gitPullInit({ triggeredFromBottomBar: true }));
    },
    merge: () => {
      AnalyticsUtil.logEvent("GS_MERGE_GIT_MODAL_TRIGGERED", {
        source: "BOTTOM_BAR_GIT_MERGE_BUTTON",
      });
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.MERGE,
        }),
      );
    },
    gitStatus,
    isFetchingGitStatus,
    pullDisabled,
    pullTooltipMessage,
    showPullLoadingState,
    changesToCommit,
  });
  return featureFlags.GIT && isGitConnected ? (
    <Container>
      <BranchButton />
      {quickActionButtons.map((button) => (
        <QuickActionButton key={button.tooltipText} {...button} />
      ))}
    </Container>
  ) : (
    <ConnectGitPlaceholder />
  );
}
