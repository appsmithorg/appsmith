import {
  getEntityNameAndPropertyPath,
  isATriggerPath,
  isJSAction,
} from "ce/workers/Evaluation/evaluationUtils";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { get, set } from "lodash";
import { LintErrorsStore } from "reducers/lintingReducers/lintErrorsReducers";
import { TJSPropertiesState } from "workers/common/DataTreeEvaluator";
import { createEvaluationContext } from "workers/Evaluation/evaluate";
import { getActionTriggerFunctionNames } from "workers/Evaluation/fns";
import {
  lintBindingPath,
  lintJSObject,
  lintTriggerPath,
  pathRequiresLinting,
} from "./utils";

export function getlintErrorsFromTree(
  pathsToLint: string[],
  unEvalTree: DataTree,
  jsPropertiesState: TJSPropertiesState,
  cloudHosting: boolean,
): LintErrorsStore {
  const lintTreeErrors: LintErrorsStore = {};
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

  const evalContextWithOutFunctions = createEvaluationContext({
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
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      fullPropertyPath,
    );
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = (get(
      unEvalTree,
      fullPropertyPath,
    ) as unknown) as string;
    // remove all lint errors from path
    set(lintTreeErrors, `["${fullPropertyPath}"]`, []);

    // We are only interested in paths that require linting
    if (!pathRequiresLinting(unEvalTree, entity, fullPropertyPath)) return;
    if (isATriggerPath(entity, propertyPath))
      return triggerPaths.add(fullPropertyPath);
    if (isJSAction(entity))
      return bindingPathsRequiringFunctions.add(`${entityName}.body`);
    const lintErrors = lintBindingPath({
      dynamicBinding: unEvalPropertyValue,
      entity,
      fullPropertyPath,
      globalData: evalContextWithOutFunctions,
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
        // remove all lint errors from path
        set(lintTreeErrors, `["${entityName}.body"]`, []);
        const jspropertyState = get(jsPropertiesState, entityName);
        const lintErrors = lintJSObject(
          entityName,
          jspropertyState,
          evalContext,
        );
        set(lintTreeErrors, `["${entityName}.body"]`, lintErrors);
      });
    }

    // Lint triggerPaths
    if (triggerPaths.size) {
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
          globalData: evalContext,
        });
        set(lintTreeErrors, `["${triggerPath}"]`, lintErrors);
      });
    }
  }

  return lintTreeErrors;
}
