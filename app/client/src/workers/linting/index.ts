import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
} from "entities/DataTree/dataTreeFactory";
import { get } from "lodash";
import { EvaluationError, getDynamicBindings } from "utils/DynamicBindingUtils";
import {
  createGlobalData,
  EvaluationScriptType,
  getScriptToEval,
  getScriptType,
} from "workers/evaluate";
import {
  addErrorToEntityProperty,
  getEntityNameAndPropertyPath,
  isATriggerPath,
  isJSAction,
  removeLintErrorsFromEntityProperty,
} from "workers/evaluationUtils";

import {
  getJSSnippetToLint,
  getLintingContextData,
  getLintingErrors,
  pathRequiresLinting,
} from "./utils";

export const lintTree = (
  unEvalTree: DataTree,
  evalTree: DataTree,
  sortedDependencies: string[],
  triggerPathsToLint: string[],
  resolvedFunctions: Record<string, any>,
) => {
  const triggerPaths = [...triggerPathsToLint];
  sortedDependencies.forEach((fullPropertyPath) => {
    const { entityName, propertyPath } = getEntityNameAndPropertyPath(
      fullPropertyPath,
    );
    const entity = unEvalTree[entityName];
    const unEvalPropertyValue = (get(
      unEvalTree,
      fullPropertyPath,
    ) as unknown) as string;
    if (isATriggerPath(entity, propertyPath)) {
      return triggerPaths.push(fullPropertyPath);
    }
    if (pathRequiresLinting(unEvalTree, entity, fullPropertyPath)) {
      removeLintErrorsFromEntityProperty(evalTree, fullPropertyPath);
      const lintErrors = lintBindingPath(
        unEvalTree,
        unEvalPropertyValue,
        entity,
        fullPropertyPath,
        resolvedFunctions,
      );
      addErrorToEntityProperty(lintErrors, evalTree, fullPropertyPath);
    }
  });
  // Lint triggerPaths
  if (triggerPaths.length) {
    triggerPaths.forEach((triggerPath) => {
      removeLintErrorsFromEntityProperty(evalTree, triggerPath);
      const { entityName } = getEntityNameAndPropertyPath(triggerPath);
      const entity = unEvalTree[entityName] as DataTreeWidget | DataTreeAction;
      const unEvalPropertyValue = (get(
        unEvalTree,
        triggerPath,
      ) as unknown) as string;
      const errors = lintTriggerPath(
        unEvalPropertyValue,
        entity,
        unEvalTree,
        resolvedFunctions,
      );

      errors.length && addErrorToEntityProperty(errors, evalTree, triggerPath);
    });
  }
};

const lintBindingPath = (
  dataTree: DataTree,
  dynamicBinding: string,
  entity: DataTreeEntity,
  fullPropertyPath: string,
  resolvedFunctions: Record<string, any>,
) => {
  let lintErrors: EvaluationError[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  // Get the {{binding}} bound values
  const { jsSnippets, stringSegments } = getDynamicBindings(
    dynamicBinding,
    entity,
  );

  if (stringSegments) {
    jsSnippets.map((jsSnippet) => {
      const jsSnippetToLint = getJSSnippetToLint(
        entity,
        jsSnippet,
        propertyPath,
      );
      if (jsSnippet) {
        const GLOBAL_DATA: Record<string, any> = createGlobalData(
          dataTree,
          resolvedFunctions,
          !!entity && isJSAction(entity),
          getLintingContextData(entity),
          undefined,
        );
        GLOBAL_DATA.ALLOW_ASYNC = false;
        const scriptType = getScriptType(false, false);
        const scriptToLint = getScriptToEval(jsSnippetToLint, scriptType);
        lintErrors = getLintingErrors(
          scriptToLint,
          GLOBAL_DATA,
          jsSnippetToLint,
          scriptType,
        );
      }
    });
  }
  return lintErrors;
};

const lintTriggerPath = (
  userScript: string,
  entity: DataTreeEntity,
  currentTree: DataTree,
  resolvedFunctions: Record<string, any>,
) => {
  const { jsSnippets } = getDynamicBindings(userScript, entity);
  const script = getScriptToEval(jsSnippets[0], EvaluationScriptType.TRIGGERS);
  const GLOBAL_DATA = createGlobalData(currentTree, resolvedFunctions, true);

  return getLintingErrors(
    script,
    GLOBAL_DATA,
    jsSnippets[0],
    EvaluationScriptType.TRIGGERS,
  );
};
