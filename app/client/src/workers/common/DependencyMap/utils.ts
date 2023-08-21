import { find, toPath, union } from "lodash";
import type { EvalError, DependencyMap } from "utils/DynamicBindingUtils";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";
import { extractIdentifierInfoFromCode } from "@shared/ast";
import {
  convertPathToString,
  getEntityNameAndPropertyPath,
  isJSActionConfig,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";

import type {
  ConfigTree,
  DataTreeEntity,
  WidgetEntity,
  WidgetEntityConfig,
} from "entities/DataTree/dataTreeFactory";
import {
  DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  JAVASCRIPT_KEYWORDS,
} from "constants/WidgetValidation";
import { APPSMITH_GLOBAL_FUNCTIONS } from "components/editorComponents/ActionCreator/constants";
import { libraryReservedIdentifiers } from "workers/common/JSLibrary";

/** This function extracts validReferences and invalidReferences from a binding {{}}
 * @param script
 * @param allPaths
 * @returns validReferences - Valid references from bindings
 * invalidReferences- References which are currently invalid
 * @example - For binding {{unknownEntity.name + Api1.name}}, it returns
 * {
 * validReferences:[Api1.name],
 * invalidReferences: [unknownEntity.name]
 * }
 */
export const extractInfoFromBinding = (
  script: string,
  allKeys: Record<string, true>,
) => {
  const { references } = extractIdentifierInfoFromCode(
    script,
    self.evaluationVersion,
    invalidEntityIdentifiers,
  );
  return getPrunedReferences(references, allKeys);
};

export const getPrunedReferences = (
  references: string[],
  allKeys: Record<string, true>,
) => {
  const prunedReferences: Set<string> = new Set<string>();

  references.forEach((reference: string) => {
    // If the identifier exists directly, add it and return
    if (allKeys.hasOwnProperty(reference)) {
      prunedReferences.add(reference);
      return;
    }
    const subpaths = toPath(reference);
    let current = "";
    // We want to keep going till we reach top level, but not add top level
    // Eg: Input1.text should not depend on entire Table1 unless it explicitly asked for that.
    // This is mainly to avoid a lot of unnecessary evals, if we feel this is wrong
    // we can remove the length requirement, and it will still work
    while (subpaths.length > 1) {
      current = convertPathToString(subpaths);
      // We've found the dep, add it and return
      if (allKeys.hasOwnProperty(current)) {
        prunedReferences.add(current);
        return;
      }
      subpaths.pop();
    }
    // If no valid reference is derived, add reference as is
    prunedReferences.add(reference);
  });
  return Array.from(prunedReferences);
};

interface BindingsInfo {
  references: string[];
  errors: EvalError[];
}
export const extractInfoFromBindings = (
  bindings: string[],
  allKeys: Record<string, true>,
) => {
  return bindings.reduce(
    (bindingsInfo: BindingsInfo, binding) => {
      try {
        const references = extractInfoFromBinding(binding, allKeys);
        return {
          ...bindingsInfo,
          references: union(bindingsInfo.references, references),
        };
      } catch (error) {
        const newEvalError: EvalError = {
          type: EvalErrorTypes.EXTRACT_DEPENDENCY_ERROR,
          message: (error as Error).message,
          context: {
            script: binding,
          },
        };
        return {
          ...bindingsInfo,
          errors: union(bindingsInfo.errors, [newEvalError]),
        };
      }
    },
    { references: [], errors: [] },
  );
};

export function listValidationDependencies(
  entity: WidgetEntity,
  entityName: string,
  entityConfig: WidgetEntityConfig,
): DependencyMap {
  const validationDependency: DependencyMap = {};
  if (isWidget(entity)) {
    const { validationPaths } = entityConfig;

    Object.entries(validationPaths).forEach(
      ([propertyPath, validationConfig]) => {
        if (validationConfig.dependentPaths) {
          const dependencyArray = validationConfig.dependentPaths.map(
            (path) => `${entityName}.${path}`,
          );
          validationDependency[`${entityName}.${propertyPath}`] =
            dependencyArray;
        }
      },
    );
  }
  return validationDependency;
}

/**This function returns a unique array containing a merge of both arrays
 * @param currentArr
 * @param updateArr
 * @returns A unique array containing a merge of both arrays
 */
export const mergeArrays = <T>(currentArr: T[], updateArr: T[]): T[] => {
  if (!currentArr) return updateArr;
  return union(currentArr, updateArr);
};

/**
 * Identifiers which can not be valid names of entities and are not dynamic in nature.
 * therefore should be removed from the list of references extracted from code.
 * NB: DATA_TREE_KEYWORDS in app/client/src/constants/WidgetValidation.ts isn't included, although they are not valid entity names,
 * they can refer to potentially dynamic entities.
 * Eg. "appsmith"
 */
export const invalidEntityIdentifiers: Record<string, unknown> = {
  ...JAVASCRIPT_KEYWORDS,
  ...APPSMITH_GLOBAL_FUNCTIONS,
  ...DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
  ...libraryReservedIdentifiers,
};

export function isADynamicTriggerPath(
  entity: DataTreeEntity,
  propertyPath: string,
  entityConfig: WidgetEntityConfig,
) {
  if (isWidget(entity)) {
    const dynamicTriggerPathlist = entityConfig?.dynamicTriggerPathList;
    const isTriggerPath = find(dynamicTriggerPathlist, { key: propertyPath });
    if (isTriggerPath) {
      return true;
    }
    return false;
  }
}

export function isJSFunction(configTree: ConfigTree, fullPath: string) {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(fullPath);
  const entityConfig = configTree[entityName];
  return (
    isJSActionConfig(entityConfig) &&
    propertyPath &&
    propertyPath in entityConfig.meta
  );
}
export function convertArrayToObject(arr: string[]) {
  return arr.reduce((acc, item) => {
    return { ...acc, [item]: true } as const;
  }, {} as Record<string, true>);
}
