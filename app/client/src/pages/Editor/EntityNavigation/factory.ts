import PropertyPaneNavigation from "./PropertyPane";
import ActionPaneNavigation from "./ActionPane";
import type { EntityInfo } from "./types";
import { call } from "redux-saga/effects";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type PaneNavigation from "./PaneNavigation";
import JSObjectsPaneNavigation from "./JSObjectsPane";

export default class EntityNavigationFactory {
  static *create(entityInfo: EntityInfo) {
    switch (entityInfo.entityType) {
      case ENTITY_TYPE.WIDGET:
        return new PropertyPaneNavigation(entityInfo);
      case ENTITY_TYPE.ACTION:
        const instance: PaneNavigation = yield call(
          ActionPaneNavigation.create,
          entityInfo,
        );

        return instance;
      case ENTITY_TYPE.JSACTION:
        return new JSObjectsPaneNavigation(entityInfo);
      default:
        throw Error(`Invalid entity type`);
    }
  }
}
