import { Colors } from "constants/Colors";
import { Text, TextType } from "design-system-old";
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
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
    case Status.INACTIVE:
      return {
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
    case Status.PENDING:
      return {
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
    case Status.EXPIRED:
      return {
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
    case Status.ACTIVE:
      return {
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
    default:
      return {
        background: Colors.GREEN_3,
        text: Colors.GREEN,
      };
  }
}

export type StatusColors = {
  background: string;
  text: string;
};

export const StatusBadgeContainer = styled.div<{
  background: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 4px;
  border-radius: 4px;
  height: 24px;
  background-color: ${(props) => props.background};
`;

export const StatusText = styled(Text)`
  font-size: 11px;
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
    <StatusBadgeContainer
      background={statusColors.background}
      className={className}
    >
      <StatusText color={statusColors.text} type={TextType.P3} weight="600">
        {statusText.toLocaleUpperCase()}
      </StatusText>
    </StatusBadgeContainer>
  );
}
