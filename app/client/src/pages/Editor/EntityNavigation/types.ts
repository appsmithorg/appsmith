import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";

export interface EntityInfo {
  entityType: ENTITY_TYPE;
  id: string;
  // The propertyPath to a control field
  propertyPath?: string;
  position?: {
    ch: number;
    line: number;
  };
}

export interface PropertyPaneNavigationConfig {
  sectionId?: string;
  panelStack: IPanelStack[];
  tabIndex: number;
}

export interface IPanelStack {
  index: number;
  path: string;
  panelLabel?: string;
  styleChildren?: PropertyPaneConfig[];
  contentChildren?: PropertyPaneConfig[];
}

export interface IMatchedSection {
  id?: string;
  propertyName: string;
}

export interface IApiPaneNavigationConfig {
  tab?: string;
}

export interface IQueryPaneNavigationConfig {
  tab: string;
}

export interface IJSPaneNavigationConfig {
  tab: JSEditorTab;
}
