import type { Log } from "../../entities/AppsmithConsole";
import type { GenericEntityItem } from "../../ee/entities/IDE/constants";

export interface DebuggerReduxState {
  logs: Log[];
  isOpen: boolean;
  errors: Record<string, Log>;
  expandId: string;
  hideErrors: boolean;
  context: DebuggerContext;
  stateInspector: {
    selectedItem?: GenericEntityItem;
  };
}

export interface DebuggerContext {
  scrollPosition: number;
  errorCount: number;
  selectedDebuggerTab: string;
  responseTabHeight: number;
  selectedDebuggerFilter: string;
}

export interface CanvasDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}
