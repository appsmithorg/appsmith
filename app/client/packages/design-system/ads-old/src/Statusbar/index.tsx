import React from "react";
import styled from "styled-components";

const Wrapper = styled.div<{ active: boolean }>`
  position: relative;
  width: 100%;
  background-color: ${(props) =>
    props.active ? "var(--ads-v2-color-bg-brand-emphasis)" : ""};
  cursor: ${(props) => (props.active ? "default" : "pointer")};
  height: var(--ads-statusbar-height);
  transition: background-color 0.3s ease;

  ${(props) =>
    props.active &&
    `
      p {
        color: var(--ads-statusbar-active-p-text-color);
      }
      svg {
        fill: var(--ads-statusbar-active-svg-fill-color);
      }
  `}

  &:hover .hover-icons {
    opacity: 1;
  }
`;

const StatusText = styled.p`
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  line-height: 12px;
  margin-top: var(--ads-spaces-3);
  & .hover-icons {
    transform: translate(3px, 0px);
    opacity: 0;
  }
`;

const ProgressContainer = styled.div<ProgressContainer>`
  background-color: ${(props) =>
    props.active ? "rgb(0, 0, 0, 0.2)" : "var(--ads-v2-color-bg-subtle)"};
  overflow: hidden;
  margin-top: 12px;
  border-radius: var(--ads-v2-border-radius);
`;

const Progressbar = styled.div<StatusProgressbarType>`
  width: ${(props) => props.percentage}%;
  height: 8px;
  border-radius: var(--ads-v2-border-radius);
  background: ${(props) =>
    props.active
      ? "var(--ads-statusbar-progress-bar-background-color)"
      : "var(--ads-v2-color-bg-brand)"};
  transition:
    width 0.3s ease,
    background 0.3s ease;
`;

interface StatusProgressbarType {
  percentage: number;
  active: boolean;
}

interface ProgressContainer {
  active: boolean;
}
export function StatusProgressbar(props: StatusProgressbarType) {
  return (
    <ProgressContainer {...props}>
      <Progressbar {...props} />
    </ProgressContainer>
  );
}

interface StatusbarProps {
  percentage: number;
  active: boolean;
  message?: string;
  showOnlyMessage?: boolean;
}

export default function OnboardingStatusbar(props: StatusbarProps) {
  const { active, message, percentage, showOnlyMessage } = props;
  const displayMessage = showOnlyMessage
    ? message
    : `${percentage}% ${message}`;

  return (
    <Wrapper active={active} data-testid="statusbar-container">
      <StatusProgressbar
        active={active}
        data-testid="statusbar-text"
        percentage={percentage}
      />
      <StatusText>
        <span data-testid="statusbar-text">{displayMessage}</span>
      </StatusText>
    </Wrapper>
  );
}
