import type { ReduxAction } from "actions/ReduxActionTypes";
import type { DefaultRootState } from "react-redux";

export enum FocusElement {
  PluginActionConfigTabs = "PluginActionConfigTabs",
  CodeEditorHistory = "CodeEditorHistory",
  EntityCollapsibleState = "EntityCollapsibleState",
  EntityExplorerWidth = "EntityExplorerWidth",
  ExplorerSwitchIndex = "ExplorerSwitchIndex",
  DatasourceViewMode = "DatasourceViewMode",
  SelectedDatasource = "SelectedDatasource",
  DebuggerContext = "DebuggerContext",
  JSPaneConfigTabs = "JSPaneConfigTabs",
  PropertySections = "PropertySections",
  PropertyField = "PropertyField",
  PropertyTabs = "PropertyTabs",
  PropertyPanelContext = "PropertyPanelContext",
  PropertyPaneWidth = "PropertyPaneWidth",
  SelectedPropertyPanel = "SelectedPropertyPanel",
  SelectedWidgets = "SelectedWidgets",
  SubEntityCollapsibleState = "SubEntityCollapsibleState",
  InputField = "InputField",
  SelectedQuery = "SelectedQuery",
  SelectedJSObject = "SelectedJSObject",
  SelectedEntity = "SelectedEntity",
  IDETabs = "IDETabs",
  PluginActionDebugger = "PluginActionDebugger",
  JSDebugger = "JSDebugger",
}

export enum FocusElementConfigType {
  Redux = "Redux",
  URL = "URL",
}

interface ConfigOther {
  name: FocusElement;
  /* If a selector is added for default value, it will be supplied the state to
  derive a default value */
  defaultValue?: unknown | ((state: DefaultRootState) => unknown);
  subTypes?: Record<string, { defaultValue: unknown }>;
  persist?: boolean;
}

type ConfigRedux = {
  type: FocusElementConfigType.Redux;
  selector: (state: DefaultRootState) => unknown;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setter: (payload: any) => ReduxAction<any>;
} & ConfigOther;

type ConfigURL = {
  type: FocusElementConfigType.URL;
  selector: (url: string) => unknown;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setter: (payload: any) => void;
} & ConfigOther;

export type FocusElementConfig = ConfigRedux | ConfigURL;
