import React from "react";
import styled from "styled-components";

import BranchButton from "./BranchButton";

import { ReactComponent as UpArrow } from "assets/icons/ads/up-arrow.svg";
import { ReactComponent as DownArrow } from "assets/icons/ads/down-arrow.svg";
import { ReactComponent as Plus } from "assets/icons/ads/plus.svg";
import { ReactComponent as GitBranch } from "assets/icons/ads/git-branch.svg";

import {
  COMMIT,
  PUSH,
  PULL,
  MERGE,
  CONNECT_GIT,
  CONFLICTS_FOUND,
  NO_COMMITS_TO_PULL,
  NOT_LIVE_FOR_YOU_YET,
  COMING_SOON,
  CONNECTING_TO_REPO_DISABLED,
  DURING_ONBOARDING_TOUR,
  createMessage,
} from "constants/messages";
import { noop } from "lodash";

import Tooltip from "components/ads/Tooltip";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { useDispatch, useSelector } from "react-redux";
import { ReactComponent as GitCommitLine } from "assets/icons/ads/git-commit-line.svg";
import Button, { Category, Size } from "components/ads/Button";
import { gitPullInit, setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import getFeatureFlags from "utils/featureFlags";
import {
  getGitStatus,
  getIsGitConnected,
  getPullInProgress,
  getIsFetchingGitStatus,
  getPullFailed,
} from "selectors/gitSyncSelectors";
import SpinnerLoader from "pages/common/SpinnerLoader";
import { inOnboarding } from "sagas/OnboardingSagas";

type QuickActionButtonProps = {
  count?: number;
  disabled?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  onClick: () => void;
  tooltipText: string;
};

const QuickActionButtonContainer = styled.div<{ disabled?: boolean }>`
  padding: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[2]}px;
  margin-left: ${(props) => props.theme.spaces[2]}px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  &:hover {
    background-color: ${(props) =>
      props.theme.colors.editorBottomBar.buttonBackgroundHover};
  }
  position: relative;
  overflow: visible;
  .count {
    position: absolute;
    width: 18px;
    height: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${Colors.WHITE};
    background-color: ${Colors.BLACK};
    top: -3px;
    left: 15px;
    border-radius: 50%;
    ${(props) => getTypographyByKey(props, "p3")};
    z-index: 1;
  }
`;

const capitalizeFirstLetter = (string = " ") => {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
};

const SpinnerContainer = styled.div`
  margin-left: ${(props) => props.theme.spaces[2]}px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 26px;
`;

function QuickActionButton({
  count = 0,
  disabled = false,
  icon,
  loading,
  onClick,
  tooltipText,
}: QuickActionButtonProps) {
  return (
    <Tooltip content={capitalizeFirstLetter(tooltipText)} hoverOpenDelay={1000}>
      {loading ? (
        <SpinnerContainer>
          <SpinnerLoader height="16px" width="16px" />
        </SpinnerContainer>
      ) : (
        <QuickActionButtonContainer disabled={disabled} onClick={onClick}>
          {icon}
          {count > 0 && (
            <span className="count">{count > 9 ? `${9}+` : count}</span>
          )}
        </QuickActionButtonContainer>
      )}
    </Tooltip>
  );
}

const getPullBtnStatus = (gitStatus: any, pullFailed: boolean) => {
  const { behindCount } = gitStatus || {};
  let message = createMessage(NO_COMMITS_TO_PULL);
  const disabled = behindCount === 0;
  if (pullFailed) {
    message = createMessage(CONFLICTS_FOUND);
  } else if (behindCount > 0) {
    message = createMessage(PULL);
  }

  return {
    disabled,
    message,
  };
};

const getQuickActionButtons = ({
  commit,
  gitStatus,
  merge,
  pull,
  pullDisabled,
  pullTooltipMessage,
  push,
  showPullLoadingState,
}: {
  commit: () => void;
  push: () => void;
  pull: () => void;
  merge: () => void;
  gitStatus: any;
  pullDisabled: boolean;
  pullTooltipMessage: string;
  showPullLoadingState: boolean;
}) => {
  return [
    {
      icon: <Plus />,
      onClick: commit,
      tooltipText: createMessage(COMMIT),
    },
    {
      icon: <UpArrow />,
      onClick: push,
      tooltipText: createMessage(PUSH),
    },
    {
      count: gitStatus?.behindCount,
      icon: <DownArrow />,
      onClick: () => !pullDisabled && pull(),
      tooltipText: pullTooltipMessage,
      disabled: pullDisabled,
      loading: showPullLoadingState,
    },
    {
      icon: <GitBranch />,
      onClick: merge,
      tooltipText: createMessage(MERGE),
    },
  ];
};

const Container = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  margin-left: ${(props) => props.theme.spaces[10]}px;
`;

const StyledIcon = styled(GitCommitLine)`
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
  const isInOnboarding = useSelector(inOnboarding);

  const isTooltipEnabled = !getFeatureFlags().GIT || isInOnboarding;
  const tooltipContent = !isInOnboarding ? (
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
  const isGitConnectionEnabled = getFeatureFlags().GIT && !isInOnboarding;

  return (
    <Container>
      <Tooltip
        content={tooltipContent}
        disabled={!isTooltipEnabled}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
      >
        <Container style={{ marginLeft: 0, cursor: "pointer" }}>
          <StyledIcon />
          {isGitConnectionEnabled ? (
            <Button
              category={Category.tertiary}
              onClick={() => {
                dispatch(setIsGitSyncModalOpen({ isOpen: true }));
              }}
              size={Size.small}
              text={createMessage(CONNECT_GIT)}
            />
          ) : (
            <PlaceholderButton>{createMessage(CONNECT_GIT)}</PlaceholderButton>
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

  const quickActionButtons = getQuickActionButtons({
    commit: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.DEPLOY,
        }),
      );
    },
    push: noop,
    pull: () => dispatch(gitPullInit({ triggeredFromBottomBar: true })),
    merge: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.MERGE,
        }),
      );
    },
    gitStatus,
    pullDisabled,
    pullTooltipMessage,
    showPullLoadingState,
  });
  return getFeatureFlags().GIT && isGitConnected ? (
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
