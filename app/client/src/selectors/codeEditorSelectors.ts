import { AppState } from "reducers";

export const getCodeEditorHistory = (state: AppState) => state.ui.codeEditor;
