export * from "ce/utils/actionExecutionUtils";

import {
  getCurrentModule,
  getModuleInstances,
} from "@appsmith/selectors/entitiesSelector";
import {
  getModuleInstanceActions,
  getModuleInstanceJSCollections,
} from "@appsmith/selectors/modulesSelector";
import type { Action } from "entities/Action";
import type { JSAction, JSCollection } from "entities/JSCollection";
import store from "store";
import { getActionExecutionAnalytics as CE_getActionExecutionAnalytics } from "ce/utils/actionExecutionUtils";
import type { Plugin } from "api/PluginApi";
import type { ApplicationPayload } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentPackage } from "@appsmith/selectors/packageSelectors";

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

export function getActionExecutionAnalytics(
  action: Action,
  plugin: Plugin,
  params: Record<string, unknown>,
  currentApp: ApplicationPayload,
  datasourceId: string,
) {
  const analyticsData = CE_getActionExecutionAnalytics(
    action,
    plugin,
    params,
    currentApp,
    datasourceId,
  );
  if (!!currentApp) return analyticsData;

  const state = store.getState();
  const currentPackage = getCurrentPackage(state);
  const currentModule = getCurrentModule(state);
  return {
    ...analyticsData,
    packageId: currentPackage?.id,
    packageName: currentPackage?.name,
    moduleId: currentModule?.id,
    moduleName: currentModule?.name,
  };
}
