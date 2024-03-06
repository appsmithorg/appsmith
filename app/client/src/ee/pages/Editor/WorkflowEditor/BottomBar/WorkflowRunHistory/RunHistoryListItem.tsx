import React from "react";
import moment from "moment";
import type { WorkflowRunHistoryData } from "@appsmith/reducers/uiReducers/workflowHistoryPaneReducer";
import { getWorkflowRunStatusIconProps } from "./helpers";
import { Icon, Text } from "design-system";
import styled from "styled-components";

const RunHistoryListItemContainer = styled.div<{
  selected: boolean;
}>`
  display: flex;
  flex-direction: row;
  width: 250px;
  height: 48px;
  align-items: start;
  justify-content: start;
  margin-left: 8px;
  background-color: ${(props) =>
    props.selected ? "var(--ads-v2-color-bg-muted)" : "var(--ads-v2-color-bg)"};
  border-radius: 5px;
  padding: 4px 8px;
  cursor: pointer;
  &:hover {
    background-color: var(--ads-v2-color-bg-emphasis);
  }
`;
const ItemInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: start;
`;
const StyledIcon = styled(Icon)`
  margin-right: 8px;
  margin-top: 4px;
`;

interface HistoryListItemProps {
  data: WorkflowRunHistoryData;
  onClick?: () => void;
  selected: boolean;
}

export function RunHistoryListItem({
  data,
  onClick,
  selected,
}: HistoryListItemProps) {
  const iconProps = getWorkflowRunStatusIconProps(data.status);
  const time = moment(data.startTime).format("Do MMM YYYY, H:mm:ss");
  return (
    <RunHistoryListItemContainer onClick={onClick} selected={selected}>
      <StyledIcon {...iconProps} size="md" />
      <ItemInfoContainer>
        <Text kind="body-m">{time}</Text>
        <Text kind="action-s">ID: #{data.workflowRunId}</Text>
      </ItemInfoContainer>
    </RunHistoryListItemContainer>
  );
}
