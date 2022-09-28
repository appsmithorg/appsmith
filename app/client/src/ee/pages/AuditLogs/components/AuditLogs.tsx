import React from "react";
import Filters from "@appsmith/pages/AuditLogs/components/filters";
import { AuditLogTable as Table } from "@appsmith/pages/AuditLogs/components/AuditLogTable";
import { AuditLogsHeader as Header } from "./AuditLogsHeader";
import { StyledAuditLogsContainer as Container } from "../styled-components/container";

export default function AuditLogs() {
  return (
    <Container
      data-testid="t--audit-logs-data-container"
      id="audit-logs-data-container"
    >
      <Header />
      <Filters />
      <Table />
    </Container>
  );
}
