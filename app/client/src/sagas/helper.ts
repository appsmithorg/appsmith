import { createMessage } from "ee/constants/messages";
import type { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import type {
  FormEvalOutput,
  ConditionalOutput,
} from "reducers/evaluationReducers/formEvaluationReducer";
import { select } from "redux-saga/effects";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Log } from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "ee/entities/AppsmithConsole/utils";
import { toast } from "@appsmith/ads";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ReduxActionType } from "actions/ReduxActionTypes";
import type { Action } from "entities/Action";
import get from "lodash/get";
import set from "lodash/set";
import log from "loglevel";
import { isPlainObject, isString } from "lodash";
import { DATA_BIND_REGEX_GLOBAL } from "constants/BindingsConstants";
import { apiFailureResponseInterceptor } from "api/interceptors";
import { klonaLiteWithTelemetry } from "utils/helpers";
import { getDefaultEnvId } from "ee/api/ApiUtils";
import {
  getActions,
  getDatasourceByPluginId,
  getDatasources,
} from "ee/selectors/entitiesSelector";
import {
  DATASOURCE_NAME_DEFAULT_PREFIX,
  TEMP_DATASOURCE_ID,
} from "../constants/Datasource";
import { type Datasource, ToastMessageType } from "../entities/Datasource";
import { getNextEntityName } from "utils/AppsmithUtils";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { identifyEntityFromPath } from "navigation/FocusEntity";

// function to extract all objects that have dynamic values
export const extractFetchDynamicValueFormConfigs = (
  evalOutput: FormEvalOutput,
) => {
  let output: Record<string, ConditionalOutput> = {};

  Object.entries(evalOutput).forEach(([key, value]) => {
    if ("fetchDynamicValues" in value && !!value.fetchDynamicValues) {
      output = { ...output, [key]: value };
    }
  });

  return output;
};

// Function to extract all the objects that have to fetch dynamic values
export const extractQueueOfValuesToBeFetched = (evalOutput: FormEvalOutput) => {
  let output: Record<string, ConditionalOutput> = {};

  Object.entries(evalOutput).forEach(([key, value]) => {
    if (
      "fetchDynamicValues" in value &&
      !!value.fetchDynamicValues &&
      "allowedToFetch" in value.fetchDynamicValues &&
      value.fetchDynamicValues.allowedToFetch
    ) {
      output = { ...output, [key]: value };
    }
  });

  return output;
};

/**
 * Function checks if in API response, cyclic dependency issues are there or not
 *
 * @param layoutErrors - array of cyclical dependency issues
 * @returns boolean
 */
const checkIfNoCyclicDependencyErrors = (
  layoutErrors?: Array<LayoutOnLoadActionErrors>,
): boolean => {
  return !layoutErrors || (!!layoutErrors && layoutErrors.length === 0);
};

/**
 * // Function logs all cyclic dependency errors in debugger
 *
 * @param layoutErrors - array of cyclical dependency issues
 */
const logCyclicDependecyErrors = (
  layoutErrors?: Array<LayoutOnLoadActionErrors>,
) => {
  if (!!layoutErrors) {
    for (let index = 0; index < layoutErrors.length; index++) {
      toast.show(
        createMessage(() => {
          return layoutErrors[index]?.errorType;
        }),
        {
          kind: "error",
        },
      );
    }

    AppsmithConsole.addLogs(
      layoutErrors.reduce((acc: Log[], error: LayoutOnLoadActionErrors) => {
        acc.push({
          severity: Severity.ERROR,
          category: LOG_CATEGORY.PLATFORM_GENERATED,
          timestamp: Date.now().toString(),
          id: error?.code?.toString(),
          logType: LOG_TYPE.CYCLIC_DEPENDENCY_ERROR,
          text: !!error.message ? error.message : error.errorType,
          messages: [
            {
              message: {
                name: "CyclicalDependencyError",
                message: !!error.message ? error.message : error.errorType,
              },
              type: PLATFORM_ERROR.PLUGIN_EXECUTION,
            },
          ],
          source: {
            type: ENTITY_TYPE.ACTION,
            name: error?.code?.toString(),
            id: error?.code?.toString(),
          },
          isExpanded: false,
        });

        return acc;
      }, []),
    );
  }
};

/**
 * // Function checks and logs cyclic depedency errors
 *
 * @param layoutErrors - array of cyclical dependency issues
 */
export const checkAndLogErrorsIfCyclicDependency = (
  layoutErrors?: Array<LayoutOnLoadActionErrors>,
) => {
  if (!checkIfNoCyclicDependencyErrors(layoutErrors)) {
    logCyclicDependecyErrors(layoutErrors);
  }
};

export const RequestPayloadAnalyticsPath = "eventData.analyticsData";
/**
 * [Mutation] Utility to enhance request payload with event data, based on the Redux action type
 * @param payload : Payload to be enhanced
 * @param type : Redux action type
 * @returns : Mutated payload with the `eventData` object
 */
export const enhanceRequestPayloadWithEventData = (
  payload: unknown,
  type: ReduxActionType,
) => {
  try {
    switch (type) {
      case ReduxActionTypes.COPY_ACTION_INIT:
        const actionObject = klonaLiteWithTelemetry(
          payload,
          "helpers.enhanceRequestPayloadWithEventData",
        ) as Action;

        const path = `${RequestPayloadAnalyticsPath}.originalActionId`;
        const originalActionId = get(actionObject, path, actionObject.id);

        if (originalActionId !== undefined)
          return set(actionObject, path, originalActionId);
    }
  } catch (e) {
    log.error("Failed to enhance payload with event data", e);
  }

  return payload;
};

/**
 *
 * @param obj : A plain object to be cleaned for hashing
 * @returns A clone of the object with all string values without SQL comments, spaces, bindings and new lines
 */
export const cleanValuesInObjectForHashing = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const cleanObj: Record<string, unknown> = {};

  for (const key in obj) {
    if (isString(obj[key])) {
      cleanObj[key] = (obj[key] as string)
        .replace(DATA_BIND_REGEX_GLOBAL, "") // Remove bindings
        .replace(/\s/g, "") // Remove spaces
        .replace(/--.*/g, "") // Remove comments
        .replace(/\n/g, "") // Remove new lines
        .toLowerCase();
    } else if (isPlainObject(obj[key])) {
      cleanObj[key] = cleanValuesInObjectForHashing(
        obj[key] as Record<string, unknown>,
      );
    } else {
      cleanObj[key] = obj[key];
    }
  }

  return cleanObj;
};

/**
 * Function to generate a hash from string
 * Note: Although it uses SHA1 in the digest, the output is a hex string which is not
 * exactly the same as the SHA1 of the string. This is not meant to be a secure hash
 * function, but a way to generate a hash from a string that is consistent across
 * different runs for the same string and different for different strings.
 * @param str : String to be hashed
 * @returns A hashed string, that will be the same for the same string and different for different strings
 */
export async function generateHashFromString(str: unknown) {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(str));
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export function* getFromServerWhenNoPrefetchedResult(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prefetchedResult?: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiEffect?: any,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (prefetchedResult) {
    if (prefetchedResult?.responseMeta?.error) {
      const { responseMeta } = prefetchedResult;
      const { status } = responseMeta;

      const resp = yield apiFailureResponseInterceptor({
        response: {
          data: {
            responseMeta,
          },
          status,
        },
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      return resp;
    }

    return prefetchedResult;
  }

  return yield apiEffect();
}

export function* getInitialDatasourcePayload(
  pluginId: string,
  pluginType?: string,
  defaultDatasourceName: string = DATASOURCE_NAME_DEFAULT_PREFIX,
) {
  const dsList: Datasource[] = yield select(getDatasources);
  const datasourceName = getNextEntityName(
    defaultDatasourceName,
    dsList.map((el: Datasource) => el.name),
  );
  const defaultEnvId = getDefaultEnvId();

  return {
    id: TEMP_DATASOURCE_ID,
    name: datasourceName,
    type: pluginType,
    pluginId: pluginId,
    new: false,
    datasourceStorages: {
      [defaultEnvId]: {
        datasourceId: TEMP_DATASOURCE_ID,
        environmentId: defaultEnvId,
        isValid: false,
        datasourceConfiguration: {
          url: "",
          properties: [],
        },
        toastMessage: ToastMessageType.EMPTY_TOAST_MESSAGE,
      },
    },
  };
}

export function* getInitialActionPayload(
  pageId: string,
  pluginId: string,
  actionConfig: Action,
) {
  const updatedAiDatasources: Datasource[] = yield select(
    getDatasourceByPluginId,
    pluginId,
  );

  const actions: ActionDataState = yield select(getActions);
  const actionName = getNextEntityName(
    actionConfig.name,
    actions.map((el: ActionData) => el.config.name),
  );

  return {
    pageId,
    pluginId: updatedAiDatasources[0].pluginId,
    datasource: {
      id: updatedAiDatasources[0].id,
    },
    name: actionName,
    actionConfiguration: actionConfig.actionConfiguration,
  };
}

export function* getUpdatedTabs(newId: string, currentTabs: string[]) {
  if (currentTabs.includes(newId)) return currentTabs;

  const newTabs = [...currentTabs, newId];

  return newTabs;
}

/**
 * Adds custom redirect logic to redirect after an item is deleted
 * 1. Do not navigate if the deleted item is not selected
 * 2. If it was the only item, navigate to the list url, to show the blank state
 * 3. If there are other items, navigate to an item close to the current one
 * **/

export enum RedirectAction {
  NA = "NA", // No action is needed
  LIST = "LIST", // Navigate to a creation URL
  ITEM = "ITEM", // Navigate to this item
}

interface RedirectActionDescription<T> {
  action: RedirectAction;
  payload?: T;
}

export function getNextEntityAfterRemove<T extends EntityItem>(
  removedId: string,
  tabs: T[],
): RedirectActionDescription<T> {
  const currentSelectedEntity = identifyEntityFromPath(
    window.location.pathname,
  );
  const isSelectedActionRemoved = currentSelectedEntity.id === removedId;

  // If removed item is not currently selected, don't redirect
  if (!isSelectedActionRemoved) {
    return {
      action: RedirectAction.NA,
    };
  }

  const indexOfTab = tabs.findIndex((item) => item.key === removedId);

  switch (indexOfTab) {
    case -1:
      // If no other action is remaining, navigate to the creation url
      return {
        action: RedirectAction.LIST,
      };
    case 0:
      // if the removed item is first item, then if tabs present, tabs + 1
      // else otherItems[0] -> TODO: consider changing this logic after discussion with
      // design team. May be new listing UI for side by side
      if (tabs.length > 1) {
        return {
          action: RedirectAction.ITEM,
          payload: tabs[1],
        };
      } else {
        return {
          action: RedirectAction.LIST,
        };
      }
    default:
      return {
        action: RedirectAction.ITEM,
        payload: tabs[indexOfTab - 1],
      };
  }
}
