import { get, union } from "lodash";
import toPath from "lodash/toPath";
import {
  EvalErrorTypes,
  EvalError,
  DependencyMap,
  getDynamicBindings,
} from "utils/DynamicBindingUtils";
import { extractInfoFromCode } from "@shared/ast";
import { convertPathToString, isWidget } from "../evaluationUtils";
import {
  CURRENT_EVALUATION_VERSION,
  invalidEntityIdentifiers,
} from "./constants";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";

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
  allPaths: Record<string, true>,
): { validReferences: string[]; invalidReferences: string[] } => {
  const { references } = extractInfoFromCode(
    script,
    CURRENT_EVALUATION_VERSION,
    invalidEntityIdentifiers,
  );
  return extractInfoFromReferences(references, allPaths);
};

/** This function extracts validReferences and invalidReferences from an Array of Identifiers
 * @param references
 * @param allPaths
 * @returns validReferences - Valid references from bindings
 * invalidReferences- References which are currently invalid
 *  @example - For identifiers [unknownEntity.name , Api1.name], it returns
 * {
 * validReferences:[Api1.name],
 * invalidReferences: [unknownEntity.name]
 * }
 */
export const extractInfoFromReferences = (
  references: string[],
  allPaths: Record<string, true>,
): {
  validReferences: string[];
  invalidReferences: string[];
} => {
  const validReferences: Set<string> = new Set<string>();
  const invalidReferences: string[] = [];
  references.forEach((reference: string) => {
    // If the identifier exists directly, add it and return
    if (allPaths.hasOwnProperty(reference)) {
      validReferences.add(reference);
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
      if (allPaths.hasOwnProperty(current)) {
        validReferences.add(current);
        return;
      }
      subpaths.pop();
    }
    // If no valid reference is derived, add it to the list of invalidReferences
    invalidReferences.push(reference);
  });
  return { validReferences: Array.from(validReferences), invalidReferences };
};

interface BindingsInfo {
  validReferences: string[];
  invalidReferences: string[];
  errors: EvalError[];
}
export const extractInfoFromBindings = (
  bindings: string[],
  allPaths: Record<string, true>,
) => {
  return bindings.reduce(
    (bindingsInfo: BindingsInfo, binding) => {
      try {
        const { invalidReferences, validReferences } = extractInfoFromBinding(
          binding,
          allPaths,
        );
        return {
          ...bindingsInfo,
          validReferences: union(bindingsInfo.validReferences, validReferences),
          invalidReferences: union(
            bindingsInfo.invalidReferences,
            invalidReferences,
          ),
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
    { validReferences: [], invalidReferences: [], errors: [] },
  );
};

export function listTriggerFieldDependencies(
  entity: DataTreeWidget,
  entityName: string,
): DependencyMap {
  const triggerFieldDependency: DependencyMap = {};
  if (isWidget(entity)) {
    const dynamicTriggerPathlist = entity.dynamicTriggerPathList;
    if (dynamicTriggerPathlist && dynamicTriggerPathlist.length) {
      dynamicTriggerPathlist.forEach((dynamicPath) => {
        const propertyPath = dynamicPath.key;
        const unevalPropValue = get(entity, propertyPath);
        const { jsSnippets } = getDynamicBindings(unevalPropValue);
        const existingDeps =
          triggerFieldDependency[`${entityName}.${propertyPath}`] || [];
        triggerFieldDependency[
          `${entityName}.${propertyPath}`
        ] = existingDeps.concat(jsSnippets.filter((jsSnippet) => !!jsSnippet));
      });
    }
  }
  return triggerFieldDependency;
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
