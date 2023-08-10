import type { PropertyPaneConfig } from "constants/PropertyControlConstants";
import type { EntityPane } from "./factory";

export interface EntityInfo {
  entityType: EntityPane;
  id: string;
  // The propertyPath to a control field
  propertyPath?: string;
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
