import React from "react";
import { CurrentValueViewer } from "components/editorComponents/CodeEditor/EvaluatedValuePopup";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import JsonFilters from "@appsmith/pages/AuditLogs/components/JsonFilters";
import {
  StyledCollapseContainer as CollapseContainer,
  StyledCollapsibleLogContainer as Container,
} from "../styled-components/container";
import { AuditLogType } from "../types";
import { createMessage } from "design-system-old/build/constants/messages";
import { ON_COPY_CONTENT } from "@appsmith/constants/messages";

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
          onCopyContentText={createMessage(ON_COPY_CONTENT, log.id)}
          theme={EditorTheme.LIGHT}
        />
      </CollapseContainer>
    </Container>
  ) : null;
}
