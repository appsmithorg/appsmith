import PropertyPaneNavigation from "./PropertyPane";
// import ActionPaneNavigation from "./ActionPane";
// import JSObjectsPaneNavigation from "./JSObjectsPane";
// import type PaneNavigation from "./PaneNavigation";
import type PaneNavigation from "./PaneNavigation";
import type { EntityInfo } from "./types";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

export const entityPanes = {
  [ENTITY_TYPE.WIDGET]: PropertyPaneNavigation,
  // [ENTITY_TYPE.ACTION]: ActionPaneNavigation,
  // [ENTITY_TYPE.JSACTION]: JSObjectsPaneNavigation,
};

export type EntityPane = keyof typeof entityPanes;

export default class EntityNavigationFactory {
  static create(entityInfo: EntityInfo): PaneNavigation {
    return new entityPanes[entityInfo.entityType](entityInfo);
  }
}
