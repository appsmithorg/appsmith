import React from "react";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import JsonFilters from "@appsmith/pages/AuditLogs/components/JsonFilters";
import {
  StyledCollapseContainer as CollapseContainer,
  StyledCollapsibleLogContainer as Container,
} from "../styled-components/container";
import { AuditLogType } from "../types";

interface CollapsibleLogProps {
  log: Partial<AuditLogType>;
  isOpen: boolean;
}

export function CollapsibleLog({ isOpen, log }: CollapsibleLogProps) {
  return isOpen ? (
    <Container>
      <JsonFilters logId={log.id as string} />
      <CollapseContainer>
        <CurrentValueViewer
          collapseStringsAfterLength={32}
          evaluatedValue={log}
          hideLabel
          key={`key-value-${log.id}`}
          onCopyContentText={`Audit log with id [${log.id}] copied to clipboard`}
          theme={EditorTheme.LIGHT}
        />
      </CollapseContainer>
    </Container>
  ) : null;
}
