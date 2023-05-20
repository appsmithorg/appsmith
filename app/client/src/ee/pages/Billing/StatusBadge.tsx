import { Tag } from "design-system";
import React from "react";
import styled from "styled-components";

export enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  TRIAL = "TRIAL",
}

export function getStatusText(
  status: Status,
  statusTextMap?: Partial<Record<Status, string>>,
) {
  return statusTextMap?.[status] || status;
}

//TODO: Check with design team for the colors for other status states
export function getStatusColor(status: Status) {
  switch (status) {
    case Status.ACTIVE:
      return {
        background: "var(--ads-v2-color-bg-success)",
        text: "var(--ads-v2-color-fg-success)",
      };
    case Status.TRIAL:
      return {
        background: "var(--ads-v2-color-bg-success)",
        text: "var(--ads-v2-color-fg-success)",
      };
    default:
      return {
        background: "var(--ads-v2-color-bg-success)",
        text: "var(--ads-v2-color-fg-success)",
      };
  }
}

export type StatusColors = {
  background: string;
  text: string;
};

export const StatusBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 4px;
  border-radius: 4px;
`;

export const StatusText = styled(Tag)<{ background: string; color: string }>`
  /* 
  TODO: handle the colors on the Tag with the new component which will get introduced
  ${({ background, color }) => `
background-color: ${background};
  > span {
      color: ${color};
  } */
`}
`;

export interface StatusBadgeProps {
  status: Status;
  statusTextMap?: Partial<Record<Status, string>>;
  className?: string;
}

export function StatusBadge(props: StatusBadgeProps) {
  const { className = "", status, statusTextMap } = props;
  const statusColors = getStatusColor(status);
  const statusText = getStatusText(status, statusTextMap);
  return (
    <StatusBadgeContainer className={className} data-testid="t--status-badge">
      <StatusText
        background={statusColors.background}
        color={statusColors.text}
        data-testid="t--status-text"
        isClosable={false}
      >
        {statusText}
      </StatusText>
    </StatusBadgeContainer>
  );
}
