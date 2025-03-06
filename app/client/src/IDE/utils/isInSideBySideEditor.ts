import { EditorEntityTab, EditorViewMode } from "../Interfaces/EditorTypes";
import { EditorState } from "../enums";

/**
 * Check if use is currently working is side-by-side editor mode.
 */
export function isInSideBySideEditor({
  appState,
  segment,
  viewMode,
}: {
  viewMode: EditorViewMode;
  appState: EditorState;
  segment: EditorEntityTab;
}) {
  return (
    viewMode === EditorViewMode.SplitScreen &&
    appState === EditorState.EDITOR &&
    segment !== EditorEntityTab.UI
  );
}
