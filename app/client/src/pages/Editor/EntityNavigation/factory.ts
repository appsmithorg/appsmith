import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import { call } from "redux-saga/effects";

import ActionPaneNavigation from "./ActionPane";
import JSObjectsPaneNavigation from "./JSObjectsPane";
import type PaneNavigation from "./PaneNavigation";
import PropertyPaneNavigation from "./PropertyPane";
import type { EntityInfo } from "./types";

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
