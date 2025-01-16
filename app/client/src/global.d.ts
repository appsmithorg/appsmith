declare module "react-append-to-body";
declare module "js-regex-pl";

// Local type definitions to avoid EE imports
type EditorViewMode = "SplitScreen" | "FullScreen";
// Define AppState interface to match CE reducer state shape
interface AppState {
  entities: Record<string, unknown>;
  ui: Record<string, unknown>;
  evaluations: Record<string, unknown>;
  [key: string]: unknown;
}
type FormDataPaths = string;
interface ReduxAction<T = any> {
  type: string;
  payload: T;
}
interface CanvasDebuggerState {
  selectedTab?: string;
  open?: boolean;
}

// Define local types since they're not exported from @radix-ui/react-popper
type Align = "start" | "center" | "end";
type Side = "top" | "right" | "bottom" | "left";
