import type { Action } from "entities/Action";
import { ActionExecutionContext } from "entities/Action";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { ApplicationPayload } from "entities/Application";
import store from "store";
import { getAppMode } from "ee/selectors/applicationSelectors";
import { getDatasource } from "ee/selectors/entitiesSelector";
import { getCurrentEnvironmentDetails } from "ee/selectors/environmentSelectors";
import type { Plugin } from "api/PluginApi";
import { get, isNil } from "lodash";
import type { JSCollectionData } from "ee/reducers/entityReducers/jsActionsReducer";

export function getPluginActionNameToDisplay(action: Action) {
  return action.name;
}

export const getActionProperties = (
  action: Action,
  keyConfig: Record<string, string>,
) => {
  const actionProperties: Record<string, unknown> = {};

  Object.keys(keyConfig).forEach((key) => {
    const value = get(action, key);

    if (!isNil(value)) {
      actionProperties[keyConfig[key]] = get(action, key);
    }
  });

  return actionProperties;
};

export function getJSActionPathNameToDisplay(
  action: JSAction,
  collection: JSCollection,
) {
  return collection.name + "." + action.name;
}

export function getJSActionNameToDisplay(action: JSAction) {
  return action.name;
}

export function getCollectionNameToDisplay(
  _: JSAction,
  collectionName: string,
) {
  return collectionName;
}

export function getActionExecutionAnalytics(
  action: Action,
  plugin: Plugin,
  params: Record<string, unknown>,
  currentApp: ApplicationPayload,
  datasourceId: string,
) {
  let appMode;
  const state = store.getState();
  const datasource = getDatasource(state, datasourceId);
  const currentEnvDetails = getCurrentEnvironmentDetails(state);
  const resultObj = {
    type: action?.pluginType,
    name: action?.name,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
    pluginName: plugin?.name,
    datasourceId: datasourceId,
    isMock: !!datasource?.isMock,
    actionId: action?.id,
    inputParams: Object.keys(params).length,
    source: ActionExecutionContext.EVALUATION_ACTION_TRIGGER, // Used in analytic events to understand who triggered action execution
  };

  if (!!currentApp) {
    appMode = getAppMode(state);

    return {
      ...resultObj,
      isExampleApp: currentApp.appIsExample,
      pageId: action?.pageId,
      appId: currentApp.id,
      appMode: appMode,
      appName: currentApp.name,
    };
  }

  return resultObj;
}

/**
 * Function to check if the browser execution is allowed for the action
 * This is just for code splitting, main feature is in EE
 * */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export function isBrowserExecutionAllowed(..._args: any[]) {
  return true;
}

/**
 * Function to extract the test payload from the collection data
 * @param collectionData from the js Object
 * @param defaultValue to be returned if no information is found
 * @returns stored value from the collectionData
 * */
export const getTestPayloadFromCollectionData = (
  collectionData: JSCollectionData | undefined,
  defaultValue = "",
): string => {
  if (!collectionData) return defaultValue;

  const activeJSActionId = collectionData?.activeJSActionId;
  const testPayload: Record<string, unknown> | undefined = collectionData?.data
    ?.testPayload as Record<string, unknown>;

  if (!activeJSActionId || !testPayload) return defaultValue;

  return testPayload[activeJSActionId] as string;
};
