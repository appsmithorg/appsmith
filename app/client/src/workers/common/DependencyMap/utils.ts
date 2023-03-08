import { find, get, isEmpty, union } from "lodash";
import toPath from "lodash/toPath";
import {
  EvalErrorTypes,
  EvalError,
  DependencyMap,
  getDynamicBindings,
  getEntityDynamicBindingPathList,
} from "utils/DynamicBindingUtils";
import { extractIdentifierInfoFromCode } from "@shared/ast";
import {
  addWidgetPropertyDependencies,
  convertPathToString,
  getEntityNameAndPropertyPath,
  isAction,
  isJSAction,
  isWidget,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import {
  DataTreeAction,
  DataTreeEntity,
  DataTreeJSAction,
  DataTreeWidget,
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
  allPaths: Record<string, true>,
): { validReferences: string[]; invalidReferences: string[] } => {
  const { references } = extractIdentifierInfoFromCode(
    script,
    self.evaluationVersion,
    { ...invalidEntityIdentifiers, ...libraryReservedIdentifiers },
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

export function listValidationDependencies(
  entity: DataTreeWidget,
  entityName: string,
): DependencyMap {
  const validationDependency: DependencyMap = {};
  if (isWidget(entity)) {
    const { validationPaths } = entity;

    Object.entries(validationPaths).forEach(
      ([propertyPath, validationConfig]) => {
        if (validationConfig.dependentPaths) {
          const dependencyArray = validationConfig.dependentPaths.map(
            (path) => `${entityName}.${path}`,
          );
          validationDependency[
            `${entityName}.${propertyPath}`
          ] = dependencyArray;
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
const invalidEntityIdentifiers: Record<string, unknown> = {
  ...JAVASCRIPT_KEYWORDS,
  ...APPSMITH_GLOBAL_FUNCTIONS,
  ...DEDICATED_WORKER_GLOBAL_SCOPE_IDENTIFIERS,
};

export function listEntityDependencies(
  entity: DataTreeWidget | DataTreeAction | DataTreeJSAction,
  entityName: string,
  allPaths: Record<string, true>,
): DependencyMap {
  let dependencies: DependencyMap = {};

  if (isWidget(entity)) {
    // Adding the dynamic triggers in the dependency list as they need linting whenever updated
    // we don't make it dependent on anything else
    if (entity.dynamicTriggerPathList) {
      Object.values(entity.dynamicTriggerPathList).forEach(({ key }) => {
        dependencies[`${entityName}.${key}`] = [];
      });
    }
    const widgetDependencies = addWidgetPropertyDependencies({
      entity,
      entityName,
    });

    dependencies = {
      ...dependencies,
      ...widgetDependencies,
    };
  }

  if (isAction(entity) || isJSAction(entity)) {
    Object.entries(entity.dependencyMap).forEach(
      ([path, entityDependencies]) => {
        const actionDependentPaths: Array<string> = [];
        const mainPath = `${entityName}.${path}`;
        // Only add dependencies for paths which exist at the moment in appsmith world
        if (allPaths.hasOwnProperty(mainPath)) {
          // Only add dependent paths which exist in the data tree. Skip all the other paths to avoid creating
          // a cyclical dependency.
          entityDependencies.forEach((dependentPath) => {
            const completePath = `${entityName}.${dependentPath}`;
            if (allPaths.hasOwnProperty(completePath)) {
              actionDependentPaths.push(completePath);
            }
          });
          dependencies[mainPath] = actionDependentPaths;
        }
      },
    );
  }
  if (isJSAction(entity)) {
    // making functions dependent on their function body entities
    if (entity.reactivePaths) {
      Object.keys(entity.reactivePaths).forEach((propertyPath) => {
        const existingDeps =
          dependencies[`${entityName}.${propertyPath}`] || [];
        const unevalPropValue = get(entity, propertyPath);
        const unevalPropValueString =
          !!unevalPropValue && unevalPropValue.toString();
        const { jsSnippets } = getDynamicBindings(
          unevalPropValueString,
          entity,
        );
        dependencies[`${entityName}.${propertyPath}`] = existingDeps.concat(
          jsSnippets.filter((jsSnippet) => !!jsSnippet),
        );
      });
    }
  }

  if (isAction(entity) || isWidget(entity)) {
    // add the dynamic binding paths to the dependency map
    const dynamicBindingPathList = getEntityDynamicBindingPathList(entity);
    if (dynamicBindingPathList.length) {
      dynamicBindingPathList.forEach((dynamicPath) => {
        const propertyPath = dynamicPath.key;
        const unevalPropValue = get(entity, propertyPath);
        const { jsSnippets } = getDynamicBindings(unevalPropValue);
        const existingDeps =
          dependencies[`${entityName}.${propertyPath}`] || [];
        dependencies[`${entityName}.${propertyPath}`] = existingDeps.concat(
          jsSnippets.filter((jsSnippet) => !!jsSnippet),
        );
      });
    }
  }
  return dependencies;
}

export function listEntityPathDependencies(
  entity: DataTreeWidget | DataTreeAction | DataTreeJSAction,
  fullPropertyPath: string,
): {
  isTrigger: boolean;
  dependencies: string[];
} {
  let dependencies: string[] = [];
  const isTrigger = false;
  const { propertyPath } = getEntityNameAndPropertyPath(fullPropertyPath);
  if (isWidget(entity)) {
    if (isATriggerPath(entity, propertyPath)) {
      return {
        isTrigger: true,
        dependencies: listEntityPathTriggerFieldDependencies(
          entity,
          fullPropertyPath,
        ),
      };
    }
  }

  if (isJSAction(entity)) {
    if (entity.bindingPaths.hasOwnProperty(propertyPath)) {
      const unevalPropValue = get(entity, propertyPath);
      const unevalPropValueString =
        !!unevalPropValue && unevalPropValue.toString();
      const { jsSnippets } = getDynamicBindings(unevalPropValueString, entity);
      dependencies = dependencies.concat(
        jsSnippets.filter((jsSnippet) => !!jsSnippet),
      );
    }
  }

  if (isAction(entity) || isWidget(entity)) {
    if (
      entity.bindingPaths.hasOwnProperty(propertyPath) ||
      find(entity.dynamicBindingPathList, { key: propertyPath })
    ) {
      const unevalPropValue = get(entity, propertyPath);
      const { jsSnippets } = getDynamicBindings(unevalPropValue);
      dependencies = dependencies.concat(
        jsSnippets.filter((jsSnippet) => !!jsSnippet),
      );
    }
  }
  return { isTrigger, dependencies };
}

export function listEntityPathTriggerFieldDependencies(
  entity: DataTreeWidget,
  fullPath: string,
) {
  let triggerFieldDependencies: string[] = [];
  const { propertyPath } = getEntityNameAndPropertyPath(fullPath);

  if (isADynamicTriggerPath(entity, propertyPath)) {
    const unevalPropValue = get(entity, propertyPath);
    const { jsSnippets } = getDynamicBindings(unevalPropValue);
    triggerFieldDependencies = jsSnippets.filter((jsSnippet) => !!jsSnippet);
  }

  return triggerFieldDependencies;
}

export function isADynamicTriggerPath(
  entity: DataTreeEntity,
  propertyPath: string,
) {
  if (isWidget(entity)) {
    const dynamicTriggerPathlist = entity.dynamicTriggerPathList;
    const isTriggerPath = find(dynamicTriggerPathlist, { key: propertyPath });
    if (isTriggerPath) {
      return true;
    }
    return false;
  }
}

function isATriggerPath(entity: DataTreeEntity, propertyPath: string) {
  if (isWidget(entity)) {
    const triggerPaths = entity.triggerPaths;
    return triggerPaths.hasOwnProperty(propertyPath);
  }
  return false;
}

export function updateMap(
  map: DependencyMap,
  path: string,
  updates: string[],
  options: Partial<{ deleteOnEmpty: boolean; replaceValue: boolean }> = {},
) {
  const { deleteOnEmpty, replaceValue } = options;
  const oldValue = replaceValue ? [] : map[path];
  const updatedEntries = mergeArrays(oldValue, updates);
  if (deleteOnEmpty && isEmpty(updatedEntries)) {
    delete map[path];
  } else {
    map[path] = updatedEntries;
  }
}
