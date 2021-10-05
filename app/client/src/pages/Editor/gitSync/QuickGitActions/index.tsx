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
  createMessage,
} from "constants/messages";
import { noop } from "lodash";

import Tooltip from "components/ads/Tooltip";
import { Colors } from "constants/Colors";
import { getTypographyByKey } from "constants/DefaultTheme";
import { getIsGitRepoSetup } from "selectors/gitSyncSelectors";
import { useDispatch, useSelector } from "react-redux";
import { ReactComponent as GitCommitLine } from "assets/icons/ads/git-commit-line.svg";
import Button, { Category, Size } from "components/ads/Button";
import { setIsGitSyncModalOpen } from "actions/gitSyncActions";
import { GitSyncModalTab } from "entities/GitSync";
import getFeatureFlags from "utils/featureFlags";

type QuickActionButtonProps = {
  count?: number;
  icon: React.ReactNode;
  onClick: () => void;
  tooltipText: string;
};

const QuickActionButtonContainer = styled.div`
  padding: ${(props) => props.theme.spaces[1]}px
    ${(props) => props.theme.spaces[2]}px;
  margin-left: ${(props) => props.theme.spaces[2]}px;
  cursor: pointer;
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

function QuickActionButton({
  count = 0,
  icon,
  onClick,
  tooltipText,
}: QuickActionButtonProps) {
  return (
    <Tooltip content={tooltipText} hoverOpenDelay={1000}>
      <QuickActionButtonContainer onClick={onClick}>
        {icon}
        {count > 0 && (
          <span className="count">{count > 9 ? `${9}+` : count}</span>
        )}
      </QuickActionButtonContainer>
    </Tooltip>
  );
}

const getQuickActionButtons = ({
  commit,
  merge,
  pull,
  push,
}: {
  commit: () => void;
  push: () => void;
  pull: () => void;
  merge: () => void;
}) => [
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
    icon: <DownArrow />,
    onClick: pull,
    tooltipText: createMessage(PULL),
  },
  {
    icon: <GitBranch />,
    onClick: merge,
    tooltipText: createMessage(MERGE),
  },
];

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
  const isGitRepoSetup = useSelector(getIsGitRepoSetup);
  const dispatch = useDispatch();

  const quickActionButtons = getQuickActionButtons({
    commit: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.GIT_CONNECTION,
        }),
      );
    },
    push: noop,
    pull: noop,
    merge: () => {
      dispatch(
        setIsGitSyncModalOpen({
          isOpen: true,
          tab: GitSyncModalTab.MERGE,
        }),
      );
    },
  });
  return getFeatureFlags().GIT && isGitRepoSetup ? (
    <Container>
      <BranchButton />
      {quickActionButtons.map((button) => (
        <QuickActionButton key={button.tooltipText} {...button} count={0} />
      ))}
    </Container>
  ) : (
    <ConnectGitPlaceholder />
  );
}
