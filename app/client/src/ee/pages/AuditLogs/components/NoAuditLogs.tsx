import React from "react";
import { StyledNoAuditLogsContainer } from "../styled-components/container";
import { Text, TextType } from "design-system-old";
import EmptyState3x from "assets/images/empy-state-3x.png";
import {
  NO_SEARCH_DATA_TEXT,
  TRY_AGAIN_WITH_YOUR_FILTER,
} from "@appsmith/constants/messages";
import { createMessage } from "design-system-old/build/constants/messages";

export default function NoAuditLogs() {
  return (
    <StyledNoAuditLogsContainer data-testid="t--audit-logs-no-logs">
      <img
        alt="No result found"
        className="no-result-found-image"
        src={EmptyState3x}
      />
      <Text type={TextType.P0}>{createMessage(NO_SEARCH_DATA_TEXT)}</Text>
      <Text type={TextType.P1}>
        {createMessage(TRY_AGAIN_WITH_YOUR_FILTER)}
      </Text>
    </StyledNoAuditLogsContainer>
  );
}
