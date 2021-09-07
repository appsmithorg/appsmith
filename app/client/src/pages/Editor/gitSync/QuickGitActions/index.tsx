import React from "react";
import styled from "styled-components";
import { ReactComponent as UpArrow } from "assets/icons/ads/up-arrow.svg";
import { ReactComponent as DownArrow } from "assets/icons/ads/down-arrow.svg";
import { ReactComponent as Plus } from "assets/icons/ads/plus.svg";
// import { ReactComponent as GitMerge } from "assets/icons/ads/git-merge.svg";
import { ReactComponent as GitBranch } from "assets/icons/ads/git-branch.svg";

import { COMMIT, PUSH, PULL, MERGE, createMessage } from "constants/messages";
import { noop } from "lodash";

type QuickActionButtonProps = {
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
`;

function QuickActionButton({
  icon,
  onClick,
}: // tooltipText,
QuickActionButtonProps) {
  return (
    <QuickActionButtonContainer onClick={onClick}>
      {icon}
    </QuickActionButtonContainer>
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
`;

export default function QuickGitActions() {
  const quickActionButtons = getQuickActionButtons({
    commit: noop,
    push: noop,
    pull: noop,
    merge: noop,
  });
  return (
    <Container>
      {quickActionButtons.map((button) => (
        <QuickActionButton key={button.tooltipText} {...button} />
      ))}
    </Container>
  );
}
