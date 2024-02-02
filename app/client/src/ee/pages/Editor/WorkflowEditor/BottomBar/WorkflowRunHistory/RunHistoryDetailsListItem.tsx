import React from "react";
import type { WorkflowRunDetailsData } from "@appsmith/reducers/uiReducers/workflowHistoryPaneReducer";
import { getWorkflowActivityStatusIconProps } from "./helpers";
import { Icon, Text } from "design-system";
import moment from "moment";
import styled from "styled-components";

interface HistoryDetailsListItemProps {
  data: WorkflowRunDetailsData;
}

const StyledIcon = styled(Icon)`
  margin-right: 8px;
`;

const RunHistoryListItemContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 24px;
  width: 100%;
  padding: 4px 0px;
  align-items: center;
`;

const TimeText = styled(Text)`
  margin-left: auto;
  margin-right: 8px;
`;

export function RunHistoryDetailsListItem({
  data,
}: HistoryDetailsListItemProps) {
  const iconProps = getWorkflowActivityStatusIconProps(data.status);
  const time = moment(data.eventTime).format("D/MM/YY | H:mm:ss");
  return (
    <RunHistoryListItemContainer>
      <StyledIcon {...iconProps} size="md" />
      <Text kind="body-m">{data.description}</Text>
      <TimeText kind="body-m">{time}</TimeText>
    </RunHistoryListItemContainer>
  );
}
