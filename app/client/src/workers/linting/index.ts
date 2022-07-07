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
  getLintingErrors,
  pathRequiresLinting,
} from "./utils";
import { klona } from "klona/full";

export const lintTree = (
  unEvalDataTree: DataTree,
  evalTree: DataTree,
  sortedDependencies: string[],
  triggerPathsToLint: string[],
  resolvedFunctions: Record<string, any>,
) => {
  const unEvalTree = klona(unEvalDataTree);
  const GLOBAL_DATA_WITHOUT_FUNCTIONS = createGlobalData(
    unEvalTree,
    resolvedFunctions,
    false,
  );
  const GLOBAL_DATA_WITH_FUNCTIONS = createGlobalData(
    unEvalTree,
    resolvedFunctions,
    true,
  );
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
        unEvalPropertyValue,
        entity,
        fullPropertyPath,
        isJSAction(entity)
          ? GLOBAL_DATA_WITH_FUNCTIONS
          : GLOBAL_DATA_WITHOUT_FUNCTIONS,
      );
      lintErrors.length &&
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
        GLOBAL_DATA_WITH_FUNCTIONS,
      );

      errors.length && addErrorToEntityProperty(errors, evalTree, triggerPath);
    });
  }
};

const lintBindingPath = (
  dynamicBinding: string,
  entity: DataTreeEntity,
  fullPropertyPath: string,
  globalData: ReturnType<typeof createGlobalData>,
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
        const scriptType = getScriptType(false, false);
        const scriptToLint = getScriptToEval(jsSnippetToLint, scriptType);
        lintErrors = getLintingErrors(
          scriptToLint,
          globalData,
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
  globalData: ReturnType<typeof createGlobalData>,
) => {
  const { jsSnippets } = getDynamicBindings(userScript, entity);
  const script = getScriptToEval(jsSnippets[0], EvaluationScriptType.TRIGGERS);

  return getLintingErrors(
    script,
    globalData,
    jsSnippets[0],
    EvaluationScriptType.TRIGGERS,
  );
};
