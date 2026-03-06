import React from "react";
import styled from "styled-components";
import { Button, Tooltip } from "@appsmith/ads";
import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { useSelector } from "react-redux";
import { getIsAIEnabled } from "ee/selectors/aiAssistantSelectors";

interface AskAIButtonProps {
  mode: TEditorModes;
  onClick: () => void;
  entity: FieldEntityInformation;
}

const StyledButton = styled(Button)`
  background: linear-gradient(
    135deg,
    var(--ads-v2-color-bg) 0%,
    var(--ads-v2-color-bg-subtle) 100%
  );
  border: 1px solid var(--ads-v2-color-border);
  transition: all 0.2s ease;

  &:hover {
    background: var(--ads-v2-color-bg-emphasis);
    border-color: var(--ads-v2-color-border-emphasis);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }

  .sparkle-icon {
    color: var(--ads-v2-color-fg-brand);
  }
`;

const KeyboardHint = styled.span`
  font-size: 10px;
  color: var(--ads-v2-color-fg-muted);
  margin-left: 4px;
  opacity: 0.7;
`;

export function AskAIButton(props: AskAIButtonProps) {
  const isAIEnabled = useSelector(getIsAIEnabled);

  if (!isAIEnabled) {
    return null;
  }

  return (
    <Tooltip content="Open AI Assistant (⌘I)" placement="top">
      <StyledButton
        kind="tertiary"
        onClick={props.onClick}
        size="sm"
        startIcon="sparkling-filled"
      >
        Ask AI
        <KeyboardHint>⌘I</KeyboardHint>
      </StyledButton>
    </Tooltip>
  );
}
