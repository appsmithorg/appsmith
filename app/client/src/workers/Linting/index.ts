import { getEntityNameAndPropertyPath } from "@appsmith/workers/Evaluation/evaluationUtils";
import { get, isEmpty, set } from "lodash";
import type { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import type { LintError } from "utils/DynamicBindingUtils";
import type {
  getlintErrorsFromTreeProps,
  getlintErrorsFromTreeResponse,
} from "./types";
import {
  getEvaluationContext,
  lintBindingPath,
  lintJSObjectBody,
  lintJSObjectProperty,
  lintTriggerPath,
  sortLintingPathsByType,
} from "./utils";

export function getlintErrorsFromTree({
  asyncJSFunctionsInSyncFields,
  cloudHosting,
  jsPropertiesState,
  pathsToLint,
  unEvalTree,
}: getlintErrorsFromTreeProps): getlintErrorsFromTreeResponse {
  const lintTreeErrors: LintErrorsStore = {};
  const updatedJSEntities = new Set<string>();

  const evalContextWithoutFunctions = getEvaluationContext(
    unEvalTree,
    cloudHosting,
    { withFunctions: false },
  );

  const { bindingPaths, jsObjectPaths, triggerPaths } = sortLintingPathsByType(
    pathsToLint,
    unEvalTree,
  );
  // Lint binding paths
  bindingPaths.forEach((bindingPath) => {
    const { entityName } = getEntityNameAndPropertyPath(bindingPath);
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = get(
      unEvalTree,
      bindingPath,
    ) as unknown as string;
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
      const unEvalPropertyValue = get(
        unEvalTree,
        triggerPath,
      ) as unknown as string;
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
      const { entityName: jsObjectName } =
        getEntityNameAndPropertyPath(jsObjectPath);
      const jsObjectState = get(jsPropertiesState, jsObjectName);
      const jsObjectBodyPath = `["${jsObjectName}.body"]`;
      updatedJSEntities.add(jsObjectName);
      // An empty state shows that there is a parse error in the jsObject or the object is empty, so we lint the entire body
      // instead of an individual property
      if (isEmpty(jsObjectState)) {
        const jsObjectBodyLintErrors = lintJSObjectBody(
          jsObjectName,
          evalContextWithFunctions,
        );
        set(lintTreeErrors, jsObjectBodyPath, jsObjectBodyLintErrors);
      } else if (jsObjectPath !== "body") {
        const propertyLintErrors = lintJSObjectProperty(
          jsObjectPath,
          jsObjectState,
          {
            dataWithFunctions: evalContextWithFunctions,
            dataWithoutFunctions: evalContextWithoutFunctions,
          },
          asyncJSFunctionsInSyncFields,
        );
        const currentLintErrorsInBody = get(
          lintTreeErrors,
          jsObjectBodyPath,
          [] as LintError[],
        );
        const updatedLintErrors = [
          ...currentLintErrorsInBody,
          ...propertyLintErrors,
        ];
        set(lintTreeErrors, jsObjectBodyPath, updatedLintErrors);
      }
    });
  }

  return {
    errors: lintTreeErrors,
    updatedJSEntities: Array.from(updatedJSEntities),
  };
}
