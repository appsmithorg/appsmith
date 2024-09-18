// Leaving this require here. Importing causes type mismatches which have not been resolved by including the typings or any other means. Ref: https://github.com/remix-run/history/issues/802
// eslint-disable-next-line @typescript-eslint/no-var-requires
const createHistory = require("history").createBrowserHistory;

import type { History } from "history";

const history: History<AppsmithLocationState> = createHistory();

export default history;

export enum NavigationMethod {
  CommandClick = "CommandClick",
  EntityExplorer = "EntityExplorer",
  Omnibar = "Omnibar",
  Debugger = "Debugger",
  CanvasClick = "CanvasClick",
  ActionBackButton = "ActionBackButton",
  ContextSwitching = "ContextSwitching",
  AppSidebar = "AppSidebar",
  AppNavigation = "AppNavigation",
  PackageSidebar = "PackageSidebar",
  SegmentControl = "SegmentControl",
  EditorTabs = "EditorTabs",
  WorkflowSidebar = "WorkflowSidebar",
  SlashCommandHint = "SlashCommandHint",
}

export interface AppsmithLocationState {
  invokedBy?: NavigationMethod;
}
