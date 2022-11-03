import React from "react";
import { Text, TextType } from "design-system";
import { StyledCentreAlignedContainer as Container } from "../styled-components/container";
import { createMessage } from "design-system/build/constants/messages";
import { LOADING } from "@appsmith/constants/messages";

export default function LoadingAuditLogs() {
  return (
    <Container data-testid="t--audit-logs-loading">
      <Text type={TextType.P0}>{createMessage(LOADING)}</Text>
    </Container>
  );
}
