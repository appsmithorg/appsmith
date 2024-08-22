import { getAction } from "ee/selectors/entitiesSelector";
import { type Action, PluginType } from "entities/Action";
import { select } from "redux-saga/effects";

import type { EntityInfo } from "../types";
import {
  ActionPaneNavigation,
  ApiPaneNavigation,
  QueryPaneNavigation,
} from "./exports";

export default class ActionPaneNavigationFactory {
  static *create(entityInfo: EntityInfo) {
    const action: Action | undefined = yield select(getAction, entityInfo.id);
    if (!action) throw Error(`Couldn't find action with id: ${entityInfo.id}`);
    switch (action.pluginType) {
      case PluginType.API:
        return new ApiPaneNavigation(entityInfo);
      case PluginType.DB:
      case PluginType.SAAS:
      case PluginType.REMOTE:
      case PluginType.AI:
        return new QueryPaneNavigation(entityInfo);
      default:
        return new ActionPaneNavigation(entityInfo);
    }
  }
}
