import type { EntityPane } from "./factory";

export interface EntityInfo {
  entityType: EntityPane;
  id: string;
  propertyPath?: string;
}

export interface PropertyPaneNavigationConfig {
  sectionId?: string;
}
