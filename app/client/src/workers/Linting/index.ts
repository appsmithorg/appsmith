import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
  isJSAction,
} from "ce/workers/Evaluation/evaluationUtils";
import type { ConfigTree, DataTree } from "entities/DataTree/dataTreeFactory";
import { get, set } from "lodash";
import type { LintErrors } from "reducers/lintingReducers/lintErrorsReducers";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { getActionTriggerFunctionNames } from "workers/Evaluation/fns";
import { lintBindingPath, lintTriggerPath, pathRequiresLinting } from "./utils";

export function getlintErrorsFromTree(
  pathsToLint: string[],
  unEvalTree: DataTree,
  configTree: ConfigTree,
  cloudHosting: boolean,
): LintErrors {
  const lintTreeErrors: LintErrors = {};

  const evalContext = createEvaluationContext({
    dataTree: unEvalTree,
    resolvedFunctions: {},
    isTriggerBased: false,
    skipEntityFunctions: true,
  });

  const platformFnNamesMap = Object.values(
    getActionTriggerFunctionNames(cloudHosting),
  ).reduce(
    (acc, name) => ({ ...acc, [name]: true }),
    {} as { [x: string]: boolean },
  );
  Object.assign(evalContext, platformFnNamesMap);

  const evalContextWithoutFunctions = createEvaluationContext({
    dataTree: unEvalTree,
    resolvedFunctions: {},
    isTriggerBased: true,
    skipEntityFunctions: true,
  });

  // trigger paths
  const triggerPaths = new Set<string>();
  // Certain paths, like JS Object's body are binding paths where appsmith functions are needed in the global data
  const bindingPathsRequiringFunctions = new Set<string>();

  pathsToLint.forEach((fullPropertyPath) => {
    const { entityName, propertyPath } =
      getEntityNameAndPropertyPath(fullPropertyPath);
    const entity = unEvalTree[entityName];
    const entityConfig = configTree[entityName];
    const unEvalPropertyValue = get(
      unEvalTree,
      fullPropertyPath,
    ) as unknown as string;
    // remove all lint errors from path
    set(lintTreeErrors, `["${fullPropertyPath}"]`, []);

    // We are only interested in paths that require linting
    if (
      !pathRequiresLinting(unEvalTree, entity, fullPropertyPath, entityConfig)
    )
      return;
    if (isATriggerPath(entityConfig, propertyPath))
      return triggerPaths.add(fullPropertyPath);
    if (isJSAction(entity))
      return bindingPathsRequiringFunctions.add(`${entityName}.body`);
    const lintErrors = lintBindingPath({
      entity,
      fullPropertyPath,
      globalData: evalContextWithoutFunctions,
      dynamicBinding: unEvalPropertyValue,
    });
    set(lintTreeErrors, `["${fullPropertyPath}"]`, lintErrors);
  });

  if (triggerPaths.size || bindingPathsRequiringFunctions.size) {
    // we only create GLOBAL_DATA_WITH_FUNCTIONS if there are paths requiring it
    // In trigger based fields, functions such as showAlert, storeValue, etc need to be added to the global data

    // lint binding paths that need GLOBAL_DATA_WITH_FUNCTIONS
    if (bindingPathsRequiringFunctions.size) {
      bindingPathsRequiringFunctions.forEach((fullPropertyPath) => {
        const { entityName } = getEntityNameAndPropertyPath(fullPropertyPath);
        const entity = unEvalTree[entityName];
        const unEvalPropertyValue = get(
          unEvalTree,
          fullPropertyPath,
        ) as unknown as string;
        // remove all lint errors from path
        set(lintTreeErrors, `["${fullPropertyPath}"]`, []);
        const lintErrors = lintBindingPath({
          dynamicBinding: unEvalPropertyValue,
          entity,
          fullPropertyPath,
          globalData: evalContext,
        });
        set(lintTreeErrors, `["${fullPropertyPath}"]`, lintErrors);
      });
    }

    // Lint triggerPaths
    if (triggerPaths.size) {
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
          globalData: evalContext,
          userScript: unEvalPropertyValue,
          entity,
          fullPropertyPath: triggerPath,
        });
        set(lintTreeErrors, `["${triggerPath}"]`, lintErrors);
      });
    }
  }

  return lintTreeErrors;
}
