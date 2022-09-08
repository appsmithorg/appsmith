import { Toaster } from "components/ads/Toast";
import { createMessage } from "ce/constants/messages";
import { Variant } from "components/ads";
import { LayoutOnLoadActionErrors } from "constants/AppsmithActionConstants/ActionConstants";
import {
  FormEvalOutput,
  ConditionalOutput,
} from "reducers/evaluationReducers/formEvaluationReducer";
import AppsmithConsole from "utils/AppsmithConsole";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { ENTITY_TYPE } from "entities/AppsmithConsole";

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
export const checkIfNoCyclicDependencyErrors = (
  layoutErrors?: Array<LayoutOnLoadActionErrors>,
): boolean => {
  return !layoutErrors || (!!layoutErrors && layoutErrors.length === 0);
};

/**
 * // Function logs all cyclic dependency errors in debugger
 *
 * @param layoutErrors - array of cyclical dependency issues
 */
export const logCyclicDependecyErrors = (
  layoutErrors?: Array<LayoutOnLoadActionErrors>,
) => {
  if (!!layoutErrors) {
    for (let index = 0; index < layoutErrors.length; index++) {
      Toaster.show({
        text: createMessage(() => {
          return layoutErrors[index]?.errorMessage;
        }),
        variant: Variant.danger,
      });
      AppsmithConsole.addError({
        id: layoutErrors[index]?.appErrorId?.toString(),
        logType: LOG_TYPE.JS_ACTION_UPDATE,
        text: !!layoutErrors[index].debuggerErrorMessage
          ? layoutErrors[index].debuggerErrorMessage
          : layoutErrors[index].errorMessage,
        source: {
          type: ENTITY_TYPE.ACTION,
          name: layoutErrors[index]?.appErrorId?.toString(),
          id: layoutErrors[index]?.appErrorId?.toString(),
        },
      });
    }
  }
};
