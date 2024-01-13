import type {
  FieldEntityInformation,
  TEditorModes,
} from "components/editorComponents/CodeEditor/EditorConfig";

interface AskAIButtonProps {
  mode: TEditorModes;
  onClick: () => void;
  entity: FieldEntityInformation;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AskAIButton(props: AskAIButtonProps) {
  return null;
}
