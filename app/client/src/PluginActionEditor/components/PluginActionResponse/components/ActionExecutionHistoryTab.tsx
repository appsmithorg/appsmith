import React, { useState } from "react";
import styled from "styled-components";

import { Text } from "@appsmith/ads";

import type { ActionExecutionHistoryEntry } from "PluginActionEditor/store";

const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  height: 100%;
  background: var(--ads-v2-color-bg);
`;

const HistoryList = styled.div`
  border-right: 1px solid var(--ads-v2-color-border);
  overflow: auto;
`;

const HistoryItem = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--ads-v2-spaces-2);
  padding: var(--ads-v2-spaces-3);
  border: 0;
  border-bottom: 1px solid var(--ads-v2-color-border);
  background: ${({ $isSelected }) =>
    $isSelected
      ? "var(--ads-v2-color-bg-muted)"
      : "var(--ads-v2-color-bg)"};
  color: var(--ads-v2-color-fg);
  cursor: pointer;
  text-align: left;

  &:hover {
    background: var(--ads-v2-color-bg-muted);
  }
`;

const Status = styled.span<{ $status: ActionExecutionHistoryEntry["status"] }>`
  color: ${({ $status }) =>
    $status === "SUCCESS"
      ? "var(--ads-v2-color-fg-success)"
      : $status === "FAILURE"
        ? "var(--ads-v2-color-fg-error)"
        : "var(--ads-v2-color-fg-warning)"};
  font-size: 12px;
  font-weight: 600;
`;

const DetailPane = styled.div`
  overflow: auto;
  padding: var(--ads-v2-spaces-4);
`;

const Metadata = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ads-v2-spaces-3);
  padding-bottom: var(--ads-v2-spaces-4);
  border-bottom: 1px solid var(--ads-v2-color-border);
`;

const PreviewSection = styled.div`
  margin-top: var(--ads-v2-spaces-4);
`;

const Preview = styled.pre`
  margin: var(--ads-v2-spaces-2) 0 0;
  padding: var(--ads-v2-spaces-3);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background: var(--ads-v2-color-bg-muted);
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  line-height: 18px;
  overflow: auto;
  white-space: pre-wrap;
`;

const EmptyState = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--ads-v2-color-fg-muted);
`;

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

interface ActionExecutionHistoryTabProps {
  history: ActionExecutionHistoryEntry[];
}

export function ActionExecutionHistoryTab({
  history,
}: ActionExecutionHistoryTabProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const selectedRun =
    history.find((entry) => entry.id === selectedId) || history[0];

  if (!selectedRun) {
    return (
      <EmptyState>
        <Text kind="body-m">Run this query to see execution history.</Text>
      </EmptyState>
    );
  }

  return (
    <Container>
      <HistoryList>
        {history.map((entry) => (
          <HistoryItem
            $isSelected={entry.id === selectedRun.id}
            data-testid="t--action-execution-history-item"
            key={entry.id}
            onClick={() => setSelectedId(entry.id)}
            type="button"
          >
            <div>
              <Text kind="body-m">{formatTime(entry.createdAt)}</Text>
              <Text kind="body-s">{entry.environmentName || "Environment"}</Text>
            </div>
            <div>
              <Status $status={entry.status}>{entry.status}</Status>
              <Text kind="body-s">{entry.duration || "0"}ms</Text>
            </div>
          </HistoryItem>
        ))}
      </HistoryList>
      <DetailPane>
        <Metadata>
          <Text kind="body-m">Status: {selectedRun.status}</Text>
          <Text kind="body-m">Duration: {selectedRun.duration || "0"}ms</Text>
          <Text kind="body-m">
            Environment: {selectedRun.environmentName || "Environment"}
          </Text>
        </Metadata>
        <PreviewSection>
          <Text kind="heading-s">Request preview</Text>
          <Preview>{selectedRun.requestPreview || "No request preview"}</Preview>
        </PreviewSection>
        <PreviewSection>
          <Text kind="heading-s">Response preview</Text>
          <Preview>
            {selectedRun.responsePreview || "No response preview"}
          </Preview>
        </PreviewSection>
      </DetailPane>
    </Container>
  );
}
