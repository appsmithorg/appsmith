export * from "ce/utils/actionExecutionUtils";

import { getModuleInstances } from "@appsmith/selectors/entitiesSelector";
import {
  getModuleInstanceActions,
  getModuleInstanceJSCollections,
} from "@appsmith/selectors/modulesSelector";
import type { Action } from "entities/Action";
import type { JSAction, JSCollection } from "entities/JSCollection";
import store from "store";

export function getPluginActionNameToDisplay(action: Action) {
  const moduleInstanceActions = getModuleInstanceActions(store.getState());

  for (const moduleInstanceAction of moduleInstanceActions) {
    if (moduleInstanceAction.config.id === action.id) {
      const moduleInstanceId = moduleInstanceAction.config.moduleInstanceId;
      if (!moduleInstanceId) break;
      const moduleInstances = getModuleInstances(store.getState());
      const moduleInstance = moduleInstances[moduleInstanceId];
      if (!moduleInstance) break;
      return moduleInstance.name;
    }
  }

  return action.name;
}

export function getJSActionPathNameToDisplay(
  action: JSAction,
  collection: JSCollection,
) {
  const moduleInstanceJSCollections = getModuleInstanceJSCollections(
    store.getState(),
  );

  for (const moduleInstanceJSCollection of moduleInstanceJSCollections) {
    if (moduleInstanceJSCollection.config.id === action.id) {
      const moduleInstanceId =
        moduleInstanceJSCollection.config.moduleInstanceId;
      if (!moduleInstanceId) break;
      const moduleInstances = getModuleInstances(store.getState());
      const moduleInstance = moduleInstances[moduleInstanceId];
      if (!moduleInstance) break;
      return moduleInstance.name + "." + action.name;
    }
  }

  return collection.name + "." + action.name;
}

export function getJSActionNameToDisplay(action: JSAction) {
  return action.name;
}
