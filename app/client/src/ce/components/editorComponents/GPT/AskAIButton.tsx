import React from "react";
import { Button } from "@appsmith/ads";
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

export function AskAIButton(props: AskAIButtonProps) {
  const isAIEnabled = useSelector(getIsAIEnabled);

  if (!isAIEnabled) {
    return null;
  }

  return (
    <Button
      kind="tertiary"
      onClick={props.onClick}
      size="sm"
      startIcon="sparkles"
    >
      Ask AI
    </Button>
  );
}
