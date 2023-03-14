import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { get, set } from "lodash";
import { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import { getlintErrorsFromTreeProps } from "./types";
import {
  getEvaluationContext,
  lintBindingPath,
  lintJSObject,
  lintTriggerPath,
  sortLintingPathsByType,
} from "./utils";

export function getlintErrorsFromTree({
  asyncJSFunctionsInSyncFields,
  cloudHosting,
  jsPropertiesState,
  pathsToLint,
  unEvalTree,
}: getlintErrorsFromTreeProps): LintErrorsStore {
  const lintTreeErrors: LintErrorsStore = {};

  const evalContextWithoutFunctions = getEvaluationContext(
    unEvalTree,
    cloudHosting,
    { withFunctions: false },
  );

  // clear all lint errors in paths
  pathsToLint.forEach((fullPropertyPath) => {
    set(lintTreeErrors, `["${fullPropertyPath}"]`, []);
  });

  const { bindingPaths, jsObjectPaths, triggerPaths } = sortLintingPathsByType(
    pathsToLint,
    unEvalTree,
  );
  // Lint binding paths
  bindingPaths.forEach((bindingPath) => {
    const { entityName } = getEntityNameAndPropertyPath(bindingPath);
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = (get(
      unEvalTree,
      bindingPath,
    ) as unknown) as string;
    const lintErrors = lintBindingPath({
      dynamicBinding: unEvalPropertyValue,
      entity,
      fullPropertyPath: bindingPath,
      globalData: evalContextWithoutFunctions,
    });
    set(lintTreeErrors, `["${bindingPath}"]`, lintErrors);
  });

  if (triggerPaths.size || jsObjectPaths.size) {
    // we only create evalContextWithFunctions if there are paths requiring it
    // In trigger based fields, functions such as showAlert, storeValue, etc need to be added to the global data
    const evalContextWithFunctions = getEvaluationContext(
      unEvalTree,
      cloudHosting,
      { withFunctions: true },
    );
    // Lint trigger paths
    triggerPaths.forEach((triggerPath) => {
      const { entityName } = getEntityNameAndPropertyPath(triggerPath);
      const entity = unEvalTree[entityName];
      const unEvalPropertyValue = (get(
        unEvalTree,
        triggerPath,
      ) as unknown) as string;
      // remove all lint errors from path
      set(lintTreeErrors, `["${triggerPath}"]`, []);
      const lintErrors = lintTriggerPath({
        userScript: unEvalPropertyValue,
        entity,
        globalData: evalContextWithFunctions,
      });
      set(lintTreeErrors, `["${triggerPath}"]`, lintErrors);
    });

    // Lint jsobject paths
    jsObjectPaths.forEach((jsObjectPath) => {
      const { entityName } = getEntityNameAndPropertyPath(jsObjectPath);
      // remove all lint errors from path
      set(lintTreeErrors, jsObjectPath, []);
      const jspropertyState = get(jsPropertiesState, entityName);
      const lintErrors = lintJSObject(
        entityName,
        jspropertyState,
        {
          dataWithFunctions: evalContextWithFunctions,
          dataWithoutFunctions: evalContextWithoutFunctions,
        },
        asyncJSFunctionsInSyncFields,
      );
      set(lintTreeErrors, jsObjectPath, lintErrors);
    });
  }

  return lintTreeErrors;
}
