import React from "react";
import { Text, TextType } from "design-system";
import { StyledCentreAlignedContainer as Container } from "../styled-components/container";

export default function LoadingAuditLogs() {
  return (
    <Container data-testid="t--audit-logs-loading">
      <Text type={TextType.P0}>Loading...</Text>
    </Container>
  );
}
