import type { FieldEntityInformation } from "components/editorComponents/CodeEditor/EditorConfig";
import type { TEditorModes } from "components/editorComponents/CodeEditor/sql/config";

interface AskAIButtonProps {
  mode: TEditorModes;
  onClick: () => void;
  entity: FieldEntityInformation;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AskAIButton(props: AskAIButtonProps) {
  return null;
}
