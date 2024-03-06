import React from "react";
import { Spinner } from "design-system";
import { StyledCentreAlignedContainer as Container } from "../styled-components/container";

export default function LoadingAuditLogs() {
  return (
    <Container data-testid="t--audit-logs-loading">
      <Spinner size="lg" />
    </Container>
  );
}
