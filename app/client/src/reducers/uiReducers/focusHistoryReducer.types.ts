import type { FocusEntityInfo } from "navigation/FocusEntity";
import { EditorState } from "ee/entities/IDE/constants";

export interface FocusState {
  entityInfo: FocusEntityInfo;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: Record<string, any>;
}

export type FocusHistory = Record<string, FocusState>;

export interface FocusHistoryState {
  history: FocusHistory;
}

// Re-export for backward compatibility
export type { FocusEntityInfo };
export { EditorState };
