import { DataTree, DataTreeEntity } from "entities/DataTree/dataTreeFactory";
import { get } from "lodash";
import {
  EvaluationError,
  getDynamicBindings,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
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

interface LintTreeArgs {
  unEvalTree: DataTree;
  evalTree: DataTree;
  sortedDependencies: string[];
  triggerPathsToLint: string[];
}

export const lintTree = (args: LintTreeArgs) => {
  const { evalTree, sortedDependencies, triggerPathsToLint, unEvalTree } = args;
  // For non-trigger fields, functions such as showAlert, storeValue are not needed in global data
  const GLOBAL_DATA_WITHOUT_FUNCTIONS = createGlobalData(unEvalTree, {}, false);
  // In trigger based fields, functions such as showAlert, storeValue need to be added to the global data
  const GLOBAL_DATA_WITH_FUNCTIONS = createGlobalData(unEvalTree, {}, true);
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
      const entity = unEvalTree[entityName];
      const unEvalPropertyValue = (get(
        unEvalTree,
        triggerPath,
      ) as unknown) as string;
      if (isDynamicValue(unEvalPropertyValue)) {
        const errors = lintTriggerPath(
          unEvalPropertyValue,
          entity,
          GLOBAL_DATA_WITH_FUNCTIONS,
        );
        errors.length &&
          addErrorToEntityProperty(errors, evalTree, triggerPath);
      }
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
