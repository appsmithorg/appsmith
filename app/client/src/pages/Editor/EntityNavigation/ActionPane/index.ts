import { PluginType, type Action } from "entities/Action";
import type { EntityInfo } from "../types";
import { getAction } from "selectors/entitiesSelector";
import { select } from "redux-saga/effects";
import { ActionPaneNavigation, ApiPaneNavigation } from "./exports";

export default class ActionPaneNavigationFactory {
  static *create(entityInfo: EntityInfo) {
    const action: Action | undefined = yield select(getAction, entityInfo.id);

    if (!action) throw Error(`Couldn't find action with id: ${entityInfo.id}`);
    switch (action.pluginType) {
      case PluginType.API:
        return new ApiPaneNavigation(entityInfo);
      default:
        return new ActionPaneNavigation(entityInfo);
    }
  }
}
