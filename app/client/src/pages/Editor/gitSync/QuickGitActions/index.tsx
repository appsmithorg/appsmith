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
  UNCOMMITTED_CHANGES,
  CONFLICTS_FOUND,
  NO_COMMITS_TO_PULL,
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
import { GitSyncModalTab, MergeStatus } from "entities/GitSync";
import getFeatureFlags from "utils/featureFlags";
import {
  getGitStatus,
  getIsGitConnected,
  getPullMergeStatus,
  getPullInProgress,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import SpinnerLoader from "pages/common/SpinnerLoader";

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
  z-index: 0; /* fix z-index on hover */
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

const getPullBtnStatus = (gitStatus: any, pullMergeStatus?: MergeStatus) => {
  const { behindCount, conflicting = [], isClean } = gitStatus || {};
  const { conflictingFiles: pullConflicts = [] } = pullMergeStatus || {};
  let message = createMessage(NO_COMMITS_TO_PULL);
  let disabled = true;
  if (conflicting.length > 0 || pullConflicts.length > 0)
    message = createMessage(CONFLICTS_FOUND);
  else if (!isClean) message = createMessage(UNCOMMITTED_CHANGES);
  else if (behindCount > 0) {
    disabled = false;
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

  return (
    <Container>
      <Tooltip
        content={
          <>
            <div>It&apos;s not live for you yet</div>
            <div>Coming soon!</div>
          </>
        }
        disabled={getFeatureFlags().GIT}
        modifiers={{
          preventOverflow: { enabled: true },
        }}
      >
        <Container style={{ marginLeft: 0, cursor: "pointer" }}>
          <StyledIcon />
          {getFeatureFlags().GIT ? (
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
  const pullMergeStatus = useSelector(getPullMergeStatus);

  const {
    disabled: pullDisabled,
    message: pullTooltipMessage,
  } = getPullBtnStatus(gitStatus, pullMergeStatus);

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
    pull: () => dispatch(gitPullInit()),
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
