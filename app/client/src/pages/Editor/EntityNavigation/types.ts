import type { EntityPane } from "./factory";

export interface EntityInfo {
  entityType: EntityPane;
  id: string;
  // The propertyPath to a control field
  propertyPath?: string;
}

export interface PropertyPaneNavigationConfig {
  sectionId?: string;
  panelStack?: { index: number; path: string }[];
}
