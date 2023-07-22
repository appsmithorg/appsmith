import PropertyPaneNavigation from "./PropertyPane";
import ActionPaneNavigation from "./ActionPane";
import type { EntityInfo } from "./types";
import { call } from "redux-saga/effects";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import type PaneNavigation from "./PaneNavigation";

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
      default:
        throw Error(`Invalid entity type`);
    }
  }
}
