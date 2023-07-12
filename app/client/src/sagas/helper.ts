import { createMessage } from "@appsmith/constants/messages";
import type { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import type {
  FormEvalOutput,
  ConditionalOutput,
} from "reducers/evaluationReducers/formEvaluationReducer";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Log } from "entities/AppsmithConsole";
import {
  ENTITY_TYPE,
  LOG_CATEGORY,
  PLATFORM_ERROR,
  Severity,
} from "entities/AppsmithConsole";
import { toast } from "design-system";
import {
  ReduxActionTypes,
  type ReduxActionType,
} from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import get from "lodash/get";
import set from "lodash/set";
import log from "loglevel";

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
        const actionObject = payload as Action;
        const path = `${RequestPayloadAnalyticsPath}.originalActionId`;
        const originalActionId = get(actionObject, path, actionObject.id);
        if (originalActionId !== undefined)
          return set(actionObject, path, originalActionId);
    }
  } catch (e) {
    log.error("Failed to enhance payload with event data");
  }
  return payload;
};
