export enum JSEditorTab {
  CODE = "CODE",
  SETTINGS = "SETTINGS",
}

export interface JSPaneDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}

export interface JSPaneReduxState {
  isCreating: boolean;
  isSaving: Record<string, boolean>;
  isDeleting: Record<string, boolean>;
  isDirty: Record<string, boolean>;
  selectedConfigTab: JSEditorTab;
  debugger: JSPaneDebuggerState;
  isFetching?: boolean;
}
