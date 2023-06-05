import React from "react";
import { StyledNoAuditLogsContainer } from "../styled-components/container";
import { Text } from "design-system";
import EmptyState3x from "assets/images/empy-state-3x.png";
import {
  createMessage,
  NO_SEARCH_DATA_TEXT,
  TRY_AGAIN_WITH_YOUR_FILTER,
} from "@appsmith/constants/messages";

export default function NoAuditLogs() {
  return (
    <StyledNoAuditLogsContainer data-testid="t--audit-logs-no-logs">
      <img
        alt="No result found"
        className="no-result-found-image"
        src={EmptyState3x}
      />
      <Text kind="heading-s" renderAs="p">
        {createMessage(NO_SEARCH_DATA_TEXT)}
      </Text>
      <Text color="var(--ads-v2-color-fg)" renderAs="span">
        {createMessage(TRY_AGAIN_WITH_YOUR_FILTER)}
      </Text>
    </StyledNoAuditLogsContainer>
  );
}
