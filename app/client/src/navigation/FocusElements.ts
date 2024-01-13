import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";

export enum FocusElement {
  ApiPaneConfigTabs = "ApiPaneConfigTabs",
  CodeEditorHistory = "CodeEditorHistory",
  EntityCollapsibleState = "EntityCollapsibleState",
  EntityExplorerWidth = "EntityExplorerWidth",
  ExplorerSwitchIndex = "ExplorerSwitchIndex",
  DatasourceViewMode = "DatasourceViewMode",
  SelectedDatasource = "SelectedDatasource",
  DebuggerContext = "DebuggerContext",
  ApiRightPaneTabs = "ApiRightPaneTabs",
  QueryPaneConfigTabs = "QueryPaneConfigTabs",
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
  SelectedSegment = "SelectedSegment",
}

export enum FocusElementConfigType {
  Redux = "Redux",
  URL = "URL",
}

interface ConfigOther {
  name: FocusElement;
  /* If a selector is added for default value, it will be supplied the state to
  derive a default value */
  defaultValue?: unknown | ((state: AppState) => unknown);
  subTypes?: Record<string, { defaultValue: unknown }>;
}

type ConfigRedux = {
  type: FocusElementConfigType.Redux;
  selector: (state: AppState) => unknown;
  setter: (payload: any) => ReduxAction<any>;
} & ConfigOther;

type ConfigURL = {
  type: FocusElementConfigType.URL;
  selector: (url: string) => unknown;
  setter: (payload: any) => void;
} & ConfigOther;

export type FocusElementConfig = ConfigRedux | ConfigURL;
