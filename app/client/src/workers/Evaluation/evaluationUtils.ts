import {
  DependencyMap,
  EVAL_ERROR_PATH,
  EvaluationError,
  isChildPropertyPath,
  isDynamicValue,
  PropertyEvaluationErrorType,
  isPathADynamicTrigger,
} from "utils/DynamicBindingUtils";
import { Diff } from "deep-diff";
import {
  DataTree,
  DataTreeAction,
  DataTreeAppsmith,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
  DataTreeJSAction,
  PrivateWidgets,
} from "entities/DataTree/dataTreeFactory";
import _, { get, set } from "lodash";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { PluginType } from "entities/Action";
import { klona } from "klona/full";
import { warn as logWarn } from "loglevel";
import { EvalMetaUpdates } from "../common/DataTreeEvaluator/types";
import { isObject } from "lodash";
import { DataTreeObjectEntity } from "entities/DataTree/dataTreeFactory";
import { validateWidgetProperty } from "workers/common/DataTreeEvaluator/validationUtils";

// Dropdown1.options[1].value -> Dropdown1.options[1]
// Dropdown1.options[1] -> Dropdown1.options
// Dropdown1.options -> Dropdown1
export const IMMEDIATE_PARENT_REGEX = /^(.*)(\..*|\[.*\])$/;

export enum DataTreeDiffEvent {
  NEW = "NEW",
  DELETE = "DELETE",
  EDIT = "EDIT",
  NOOP = "NOOP",
}

export type DataTreeDiff = {
  payload: {
    propertyPath: string;
    value?: string;
  };
  event: DataTreeDiffEvent;
};

export class CrashingError extends Error {}

export const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach((segment) => {
    if (isInt(segment)) {
      string = string + "[" + segment + "]";
    } else {
      if (string.length !== 0) {
        string = string + ".";
      }
      string = string + segment;
    }
  });
  return string;
};

// Todo: improve the logic here
// Right now NaN, Infinity, floats, everything works
function isInt(val: string | number): boolean {
  return Number.isInteger(val) || (_.isString(val) && /^\d+$/.test(val));
}

// Removes the entity name from the property path
export function getEntityNameAndPropertyPath(
  fullPath: string,
): {
  entityName: string;
  propertyPath: string;
} {
  const indexOfFirstDot = fullPath.indexOf(".");
  if (indexOfFirstDot === -1) {
    // No dot was found so path is the entity name itself
    return {
      entityName: fullPath,
      propertyPath: "",
    };
  }
  const entityName = fullPath.substring(0, indexOfFirstDot);
  const propertyPath = fullPath.substring(indexOfFirstDot + 1);
  return { entityName, propertyPath };
}

//these paths are not required to go through evaluate tree as these are internal properties
const ignorePathsForEvalRegex =
  ".(reactivePaths|bindingPaths|triggerPaths|validationPaths|dynamicBindingPathList)";

//match if paths are part of ignorePathsForEvalRegex
const isUninterestingChangeForDependencyUpdate = (path: string) => {
  return path.match(ignorePathsForEvalRegex);
};

export const translateDiffEventToDataTreeDiffEvent = (
  difference: Diff<any, any>,
  unEvalDataTree: DataTree,
): DataTreeDiff | DataTreeDiff[] => {
  let result: DataTreeDiff | DataTreeDiff[] = {
    payload: {
      propertyPath: "",
      value: "",
    },
    event: DataTreeDiffEvent.NOOP,
  };
  if (!difference.path) {
    return result;
  }
  const propertyPath = convertPathToString(difference.path);

  // add propertyPath to NOOP event
  result.payload = {
    propertyPath,
    value: "",
  };

  //we do not need evaluate these paths coz these are internal paths
  const isUninterestingPathForUpdateTree = isUninterestingChangeForDependencyUpdate(
    propertyPath,
  );
  if (!!isUninterestingPathForUpdateTree) {
    return result;
  }
  const { entityName } = getEntityNameAndPropertyPath(propertyPath);
  const entity = unEvalDataTree[entityName];
  const isJsAction = isJSAction(entity);
  switch (difference.kind) {
    case "N": {
      result.event = DataTreeDiffEvent.NEW;
      result.payload = {
        propertyPath,
      };
      break;
    }
    case "D": {
      result.event = DataTreeDiffEvent.DELETE;
      result.payload = { propertyPath };
      break;
    }
    case "E": {
      let rhsChange, lhsChange;
      if (isJsAction) {
        rhsChange = typeof difference.rhs === "string";
        lhsChange = typeof difference.lhs === "string";
      } else {
        rhsChange =
          typeof difference.rhs === "string" && isDynamicValue(difference.rhs);

        lhsChange =
          typeof difference.lhs === "string" && isDynamicValue(difference.lhs);
      }

      // JsObject function renaming
      // remove .data from a String instance manually
      // since it won't be identified when calculating diffs
      // source for .data in a String instance -> `updateLocalUnEvalTree`
      if (
        isJsAction &&
        rhsChange &&
        difference.lhs instanceof String &&
        _.get(difference.lhs, "data")
      ) {
        result = [
          {
            event: DataTreeDiffEvent.DELETE,
            payload: {
              propertyPath: `${propertyPath}.data`,
            },
          },
          {
            event: DataTreeDiffEvent.EDIT,
            payload: {
              propertyPath,
              value: difference.rhs,
            },
          },
        ];
      } else if (rhsChange || lhsChange) {
        result = [
          {
            event: DataTreeDiffEvent.EDIT,
            payload: {
              propertyPath,
              value: difference.rhs,
            },
          },
        ];
        /**
         * If lhs is an array/object
         * Add delete events for all memberExpressions
         */
        if (Array.isArray(difference.lhs)) {
          difference.lhs.forEach((diff, idx) => {
            (result as DataTreeDiff[]).push({
              event: DataTreeDiffEvent.DELETE,
              payload: {
                propertyPath: `${propertyPath}[${idx}]`,
              },
            });
          });
        }

        if (isTrueObject(difference.lhs)) {
          Object.keys(difference.lhs).forEach((diffKey) => {
            const path = `${propertyPath}.${diffKey}`;
            (result as DataTreeDiff[]).push({
              event: DataTreeDiffEvent.DELETE,
              payload: {
                propertyPath: path,
              },
            });
          });
        }
      } else if (difference.lhs === undefined || difference.rhs === undefined) {
        // Handle static value changes that change structure that can lead to
        // old bindings being eligible
        if (
          difference.lhs === undefined &&
          (isTrueObject(difference.rhs) || Array.isArray(difference.rhs))
        ) {
          result.event = DataTreeDiffEvent.NEW;
          result.payload = { propertyPath };
        }
        if (
          difference.rhs === undefined &&
          (isTrueObject(difference.lhs) || Array.isArray(difference.lhs))
        ) {
          result.event = DataTreeDiffEvent.DELETE;
          result.payload = { propertyPath };
        }
      } else if (
        isTrueObject(difference.lhs) &&
        !isTrueObject(difference.rhs)
      ) {
        // This will happen for static value changes where a property went
        // from being an object to any other type like string or number
        // in such a case we want to delete all nested paths of the
        // original lhs object

        result = Object.keys(difference.lhs).map((diffKey) => {
          const path = `${propertyPath}.${diffKey}`;
          return {
            event: DataTreeDiffEvent.DELETE,
            payload: {
              propertyPath: path,
            },
          };
        });

        // when an object is being replaced by an array
        // list all new array accessors that are being added
        // so dependencies will be created based on existing bindings
        if (Array.isArray(difference.rhs)) {
          result = result.concat(
            translateDiffArrayIndexAccessors(
              propertyPath,
              difference.rhs,
              DataTreeDiffEvent.NEW,
            ),
          );
        }
      } else if (
        !isTrueObject(difference.lhs) &&
        isTrueObject(difference.rhs)
      ) {
        // This will happen for static value changes where a property went
        // from being any other type like string or number to an object
        // in such a case we want to add all nested paths of the
        // new rhs object
        result = Object.keys(difference.rhs).map((diffKey) => {
          const path = `${propertyPath}.${diffKey}`;
          return {
            event: DataTreeDiffEvent.NEW,
            payload: {
              propertyPath: path,
            },
          };
        });

        // when an array is being replaced by an object
        // remove all array accessors that are deleted
        // so dependencies by existing bindings are removed
        if (Array.isArray(difference.lhs)) {
          result = result.concat(
            translateDiffArrayIndexAccessors(
              propertyPath,
              difference.lhs,
              DataTreeDiffEvent.DELETE,
            ),
          );
        }
      }
      break;
    }
    case "A": {
      return translateDiffEventToDataTreeDiffEvent(
        {
          ...difference.item,
          path: [...difference.path, difference.index],
        },
        unEvalDataTree,
      );
    }
    default: {
      break;
    }
  }
  return result;
};

export const translateDiffArrayIndexAccessors = (
  propertyPath: string,
  array: unknown[],
  event: DataTreeDiffEvent,
) => {
  const result: DataTreeDiff[] = [];
  array.forEach((data, index) => {
    const path = `${propertyPath}[${index}]`;
    result.push({
      event,
      payload: {
        propertyPath: path,
      },
    });
  });
  return result;
};
/*
  Table1.selectedRow
  Table1.selectedRow.email: ["Input1.defaultText"]
 */

export const addDependantsOfNestedPropertyPaths = (
  parentPaths: Array<string>,
  inverseMap: DependencyMap,
): Set<string> => {
  const withNestedPaths: Set<string> = new Set();
  const dependantNodes = Object.keys(inverseMap);
  parentPaths.forEach((propertyPath) => {
    withNestedPaths.add(propertyPath);
    dependantNodes
      .filter((dependantNodePath) =>
        isChildPropertyPath(propertyPath, dependantNodePath),
      )
      .forEach((dependantNodePath) => {
        inverseMap[dependantNodePath].forEach((path) => {
          withNestedPaths.add(path);
        });
      });
  });
  return withNestedPaths;
};

export function isWidget(
  entity: Partial<DataTreeEntity>,
): entity is DataTreeWidget {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET
  );
}

export function isAction(
  entity: Partial<DataTreeEntity>,
): entity is DataTreeAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.ACTION
  );
}

export function isAppsmithEntity(
  entity: DataTreeEntity,
): entity is DataTreeAppsmith {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.APPSMITH
  );
}

export function isJSAction(entity: DataTreeEntity): entity is DataTreeJSAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION
  );
}

export function isJSObject(entity: DataTreeEntity): entity is DataTreeJSAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.JSACTION &&
    "pluginType" in entity &&
    entity.pluginType === PluginType.JS
  );
}

// We need to remove functions from data tree to avoid any unexpected identifier while JSON parsing
// Check issue https://github.com/appsmithorg/appsmith/issues/719
export const removeFunctions = (value: any) => {
  if (_.isFunction(value)) {
    return "Function call";
  } else if (_.isObject(value)) {
    return JSON.parse(
      JSON.stringify(value, (_, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    );
  } else {
    return value;
  }
};

export const makeParentsDependOnChildren = (
  depMap: DependencyMap,
  allkeys: Record<string, true>,
): DependencyMap => {
  //return depMap;
  // Make all parents depend on child
  Object.keys(depMap).forEach((key) => {
    depMap = makeParentsDependOnChild(depMap, key, allkeys);
    depMap[key].forEach((path) => {
      depMap = makeParentsDependOnChild(depMap, path, allkeys);
    });
  });
  return depMap;
};

export const makeParentsDependOnChild = (
  depMap: DependencyMap,
  child: string,
  allkeys: Record<string, true>,
): DependencyMap => {
  const result: DependencyMap = depMap;
  let curKey = child;
  if (!allkeys[curKey]) {
    logWarn(
      `makeParentsDependOnChild - ${curKey} is not present in dataTree.`,
      "This might result in a cyclic dependency.",
    );
  }
  let matches: Array<string> | null;
  // Note: The `=` is intentional
  // Stops looping when match is null
  while ((matches = curKey.match(IMMEDIATE_PARENT_REGEX)) !== null) {
    const parentKey = matches[1];
    // Todo: switch everything to set.
    const existing = new Set(result[parentKey] || []);
    existing.add(curKey);
    result[parentKey] = Array.from(existing);
    curKey = parentKey;
  }
  return result;
};

// The idea is to find the immediate parents of the property paths
// e.g. For Table1.selectedRow.email, the parent is Table1.selectedRow
export const getImmediateParentsOfPropertyPaths = (
  propertyPaths: Array<string>,
): Array<string> => {
  // Use a set to ensure that we dont have duplicates
  const parents: Set<string> = new Set();

  propertyPaths.forEach((path) => {
    const matches = path.match(IMMEDIATE_PARENT_REGEX);

    if (matches !== null) {
      parents.add(matches[1]);
    }
  });

  return Array.from(parents);
};

export const getAllPaths = (
  records: any,
  curKey = "",
  result: Record<string, true> = {},
): Record<string, true> => {
  // Add the key if it exists
  if (curKey) result[curKey] = true;
  if (Array.isArray(records)) {
    for (let i = 0; i < records.length; i++) {
      const tempKey = curKey ? `${curKey}[${i}]` : `${i}`;
      getAllPaths(records[i], tempKey, result);
    }
  } else if (typeof records === "object") {
    for (const key in records) {
      const tempKey = curKey ? `${curKey}.${key}` : `${key}`;
      getAllPaths(records[key], tempKey, result);
    }
  }
  return result;
};
export const trimDependantChangePaths = (
  changePaths: Set<string>,
  dependencyMap: DependencyMap,
): Array<string> => {
  const trimmedPaths = [];
  for (const path of changePaths) {
    let foundADependant = false;
    if (path in dependencyMap) {
      const dependants = dependencyMap[path];
      for (const dependantPath of dependants) {
        if (changePaths.has(dependantPath)) {
          foundADependant = true;
          break;
        }
      }
    }
    if (!foundADependant) {
      trimmedPaths.push(path);
    }
  }
  return trimmedPaths;
};

export function getSafeToRenderDataTree(
  tree: DataTree,
  widgetTypeConfigMap: WidgetTypeConfigMap,
) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const safeToRenderEntity = { ...entity };
    // Set user input values to their parsed values
    Object.entries(entity.validationPaths).forEach(([property, validation]) => {
      const value = _.get(entity, property);
      // Pass it through parse
      const { parsed } = validateWidgetProperty(
        validation,
        value,
        entity,
        property,
      );
      _.set(safeToRenderEntity, property, parsed);
    });
    // Set derived values to undefined or else they would go as bindings
    Object.keys(widgetTypeConfigMap[entity.type].derivedProperties).forEach(
      (property) => {
        _.set(safeToRenderEntity, property, undefined);
      },
    );
    return { ...tree, [entityKey]: safeToRenderEntity };
  }, tree);
}

export const addErrorToEntityProperty = (
  errors: EvaluationError[],
  dataTree: DataTree,
  fullPropertyPath: string,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(
    fullPropertyPath,
  );
  const isPrivateEntityPath = getAllPrivateWidgetsInDataTree(dataTree)[
    entityName
  ];
  const logBlackList = get(dataTree, `${entityName}.logBlackList`, {});
  if (propertyPath && !(propertyPath in logBlackList) && !isPrivateEntityPath) {
    const errorPath = `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`;
    const existingErrors = get(dataTree, errorPath, []) as EvaluationError[];
    set(dataTree, errorPath, existingErrors.concat(errors));
  }

  return dataTree;
};

export const resetValidationErrorsForEntityProperty = (
  dataTree: DataTree,
  fullPropertyPath: string,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(
    fullPropertyPath,
  );
  if (propertyPath) {
    const errorPath = `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`;
    const existingErrorsExceptValidation = (_.get(
      dataTree,
      errorPath,
      [],
    ) as EvaluationError[]).filter(
      (error) => error.errorType !== PropertyEvaluationErrorType.VALIDATION,
    );
    _.set(dataTree, errorPath, existingErrorsExceptValidation);
  }
  return dataTree;
};

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (
  item: unknown,
): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

/**
 * This function finds the datatype of the given value.
 * typeof, lodash and others will return false positives for things like array, wrapper objects, etc
 * @param value
 * @returns datatype of the received value as string
 */
export const findDatatype = (value: unknown) => {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
};

export const isDynamicLeaf = (unEvalTree: DataTree, propertyPath: string) => {
  const [entityName, ...propPathEls] = _.toPath(propertyPath);
  // Framework feature: Top level items are never leaves
  if (entityName === propertyPath) return false;
  // Ignore if this was a delete op
  if (!(entityName in unEvalTree)) return false;

  const entity = unEvalTree[entityName];
  if (!isAction(entity) && !isWidget(entity) && !isJSAction(entity))
    return false;
  const relativePropertyPath = convertPathToString(propPathEls);
  return (
    relativePropertyPath in entity.reactivePaths ||
    (isWidget(entity) && relativePropertyPath in entity.triggerPaths)
  );
};

export const addWidgetPropertyDependencies = ({
  entity,
  entityName,
}: {
  entity: DataTreeWidget;
  entityName: string;
}) => {
  const dependencies: DependencyMap = {};

  Object.entries(entity.propertyOverrideDependency).forEach(
    ([overriddenPropertyKey, overridingPropertyKeyMap]) => {
      const existingDependenciesSet = new Set(
        dependencies[`${entityName}.${overriddenPropertyKey}`] || [],
      );
      // add meta dependency
      overridingPropertyKeyMap.META &&
        existingDependenciesSet.add(
          `${entityName}.${overridingPropertyKeyMap.META}`,
        );
      // add default dependency
      overridingPropertyKeyMap.DEFAULT &&
        existingDependenciesSet.add(
          `${entityName}.${overridingPropertyKeyMap.DEFAULT}`,
        );

      dependencies[`${entityName}.${overriddenPropertyKey}`] = [
        ...existingDependenciesSet,
      ];
    },
  );
  return dependencies;
};

export const isPrivateEntityPath = (
  privateWidgets: PrivateWidgets,
  fullPropertyPath: string,
) => {
  const entityName = fullPropertyPath.split(".")[0];
  if (Object.keys(privateWidgets).indexOf(entityName) !== -1) {
    return true;
  }
  return false;
};

export const getAllPrivateWidgetsInDataTree = (
  dataTree: DataTree,
): PrivateWidgets => {
  let privateWidgets: PrivateWidgets = {};

  Object.keys(dataTree).forEach((entityName) => {
    const entity = dataTree[entityName];
    if (isWidget(entity) && !_.isEmpty(entity.privateWidgets)) {
      privateWidgets = { ...privateWidgets, ...entity.privateWidgets };
    }
  });

  return privateWidgets;
};

export const getDataTreeWithoutPrivateWidgets = (
  dataTree: DataTree,
): DataTree => {
  const privateWidgets = getAllPrivateWidgetsInDataTree(dataTree);
  const privateWidgetNames = Object.keys(privateWidgets);
  const treeWithoutPrivateWidgets = _.omit(dataTree, privateWidgetNames);
  return treeWithoutPrivateWidgets;
};
/**
 *  overrideWidgetProperties method has logic to update overriddenPropertyPaths when overridingPropertyPaths are evaluated.
 *
 *  when we evaluate widget's overridingPropertyPaths for example defaultText of input widget,
 *  we override the values like text and meta.text in dataTree, these values are called as overriddenPropertyPaths
 *
 * @param {{
 *   entity: DataTreeWidget;
 *   propertyPath: string;
 *   value: unknown;
 *   currentTree: DataTree;
 *   evalMetaUpdates: EvalMetaUpdates;
 * }} params
 * @return {*}
 */
export const overrideWidgetProperties = (params: {
  entity: DataTreeWidget;
  propertyPath: string;
  value: unknown;
  currentTree: DataTree;
  evalMetaUpdates: EvalMetaUpdates;
}) => {
  const { currentTree, entity, evalMetaUpdates, propertyPath, value } = params;
  const clonedValue = klona(value);
  if (propertyPath in entity.overridingPropertyPaths) {
    const overridingPropertyPaths =
      entity.overridingPropertyPaths[propertyPath];

    overridingPropertyPaths.forEach((overriddenPropertyPath) => {
      const overriddenPropertyPathArray = overriddenPropertyPath.split(".");
      _.set(
        currentTree,
        [entity.widgetName, ...overriddenPropertyPathArray],
        clonedValue,
      );
      // evalMetaUpdates has all updates from property which overrides meta values.
      if (
        propertyPath.split(".")[0] !== "meta" &&
        overriddenPropertyPathArray[0] === "meta"
      ) {
        const metaPropertyPath = overriddenPropertyPathArray.slice(1);
        evalMetaUpdates.push({
          widgetId: entity.widgetId,
          metaPropertyPath,
          value: clonedValue,
        });
      }
    });
  } else if (
    propertyPath in entity.propertyOverrideDependency &&
    clonedValue === undefined
  ) {
    // When a reset a widget its meta value becomes undefined, ideally they should reset to default value.
    // below we handle logic to reset meta values to default values.
    const propertyOverridingKeyMap =
      entity.propertyOverrideDependency[propertyPath];
    if (propertyOverridingKeyMap.DEFAULT) {
      const defaultValue = entity[propertyOverridingKeyMap.DEFAULT];
      const clonedDefaultValue = klona(defaultValue);
      if (defaultValue !== undefined) {
        const propertyPathArray = propertyPath.split(".");
        _.set(
          currentTree,
          [entity.widgetName, ...propertyPathArray],
          clonedDefaultValue,
        );

        return {
          overwriteParsedValue: true,
          newValue: clonedDefaultValue,
        };
      }
    }
  }
};
export function isValidEntity(
  entity: DataTreeEntity,
): entity is DataTreeObjectEntity {
  if (!isObject(entity)) {
    return false;
  }
  return "ENTITY_TYPE" in entity;
}
export const isATriggerPath = (
  entity: DataTreeEntity,
  propertyPath: string,
) => {
  return isWidget(entity) && isPathADynamicTrigger(entity, propertyPath);
};
