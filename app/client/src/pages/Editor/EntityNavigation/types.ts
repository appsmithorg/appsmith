import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { EntityTypeValue } from "@appsmith/entities/AppsmithConsole/utils";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";

export interface EntityInfo {
  entityType: EntityTypeValue;
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
  tabIndex?: number;
}

export interface IQueryPaneNavigationConfig {
  tab: string;
}

export interface IJSPaneNavigationConfig {
  tab: JSEditorTab;
}
