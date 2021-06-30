import {
  DependencyMap,
  EVAL_ERROR_PATH,
  EvaluationError,
  getEvalErrorPath,
  getEvalValuePath,
  isChildPropertyPath,
  isDynamicValue,
  PropertyEvaluationErrorType,
} from "utils/DynamicBindingUtils";
import { WidgetProps } from "widgets/BaseWidget";
import { VALIDATORS } from "./validations";
import { Diff } from "deep-diff";
import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { WidgetTypeConfigMap } from "utils/WidgetFactory";
import { Severity } from "entities/AppsmithConsole";

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

type DataTreeDiff = {
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

export const translateDiffEventToDataTreeDiffEvent = (
  difference: Diff<any, any>,
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
      const rhsChange =
        typeof difference.rhs === "string" && isDynamicValue(difference.rhs);

      const lhsChange =
        typeof difference.lhs === "string" && isDynamicValue(difference.lhs);

      if (rhsChange || lhsChange) {
        result.event = DataTreeDiffEvent.EDIT;
        result.payload = {
          propertyPath,
          value: difference.rhs,
        };
      } else if (difference.lhs === undefined || difference.rhs === undefined) {
        // Handle static value changes that change structure that can lead to
        // old bindings being eligible
        if (difference.lhs === undefined && isTrueObject(difference.rhs)) {
          result.event = DataTreeDiffEvent.NEW;
          result.payload = { propertyPath };
        }
        if (difference.rhs === undefined && isTrueObject(difference.lhs)) {
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
      }
      break;
    }
    case "A": {
      return translateDiffEventToDataTreeDiffEvent({
        ...difference.item,
        path: [...difference.path, difference.index],
      });
    }
    default: {
      break;
    }
  }
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

export function isWidget(entity: DataTreeEntity): entity is DataTreeWidget {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.WIDGET
  );
}

export function isAction(entity: DataTreeEntity): entity is DataTreeAction {
  return (
    typeof entity === "object" &&
    "ENTITY_TYPE" in entity &&
    entity.ENTITY_TYPE === ENTITY_TYPE.ACTION
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
): DependencyMap => {
  //return depMap;
  // Make all parents depend on child
  Object.keys(depMap).forEach((key) => {
    depMap = makeParentsDependOnChild(depMap, key);
    depMap[key].forEach((path) => {
      depMap = makeParentsDependOnChild(depMap, path);
    });
  });
  return depMap;
};

export const makeParentsDependOnChild = (
  depMap: DependencyMap,
  child: string,
): DependencyMap => {
  const result: DependencyMap = depMap;
  let curKey = child;

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

export function validateWidgetProperty(
  property: string,
  value: any,
  props: WidgetProps,
  validation?: VALIDATION_TYPES,
  dataTree?: DataTree,
) {
  if (!validation) {
    return { isValid: true, parsed: value };
  }
  const validator = VALIDATORS[validation];
  if (!validator) {
    return { isValid: true, parsed: value };
  }
  return validator(value, props, dataTree);
}

export function getValidatedTree(tree: DataTree) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const parsedEntity = { ...entity };
    Object.entries(entity.validationPaths).forEach(([property, validation]) => {
      const value = _.get(entity, property);
      // Pass it through parse
      const { isValid, message, parsed, transformed } = validateWidgetProperty(
        property,
        value,
        entity,
        validation,
        tree,
      );
      _.set(parsedEntity, property, parsed);
      const evaluatedValue = isValid
        ? parsed
        : _.isUndefined(transformed)
        ? value
        : transformed;
      const safeEvaluatedValue = removeFunctions(evaluatedValue);
      _.set(
        parsedEntity,
        getEvalValuePath(`${entityKey}.${property}`, false),
        safeEvaluatedValue,
      );
      if (!isValid) {
        addErrorToEntityProperty(
          [
            {
              errorType: PropertyEvaluationErrorType.VALIDATION,
              errorMessage: message || "",
              severity: Severity.ERROR,
              raw: value,
            },
          ],
          tree,
          getEvalErrorPath(`${entityKey}.${property}`, false),
        );
      }
    });
    return { ...tree, [entityKey]: parsedEntity };
  }, tree);
}

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

export const addFunctions = (dataTree: Readonly<DataTree>): DataTree => {
  const withFunction: DataTree = _.cloneDeep(dataTree);
  withFunction.actionPaths = [];
  Object.keys(withFunction).forEach((entityName) => {
    const entity = withFunction[entityName];
    if (isAction(entity)) {
      const runFunction = function(
        this: DataTreeAction,
        onSuccess: string,
        onError: string,
        params = "",
      ) {
        return {
          type: "RUN_ACTION",
          payload: {
            actionId: this.actionId,
            onSuccess: onSuccess ? `{{${onSuccess.toString()}}}` : "",
            onError: onError ? `{{${onError.toString()}}}` : "",
            params,
          },
        };
      };
      _.set(withFunction, `${entityName}.run`, runFunction);
      withFunction.actionPaths &&
        withFunction.actionPaths.push(`${entityName}.run`);
    }
  });
  withFunction.navigateTo = function(
    pageNameOrUrl: string,
    params: Record<string, string>,
    target?: string,
  ) {
    return {
      type: "NAVIGATE_TO",
      payload: { pageNameOrUrl, params, target },
    };
  };
  withFunction.actionPaths.push("navigateTo");

  withFunction.showAlert = function(message: string, style: string) {
    return {
      type: "SHOW_ALERT",
      payload: { message, style },
    };
  };
  withFunction.actionPaths.push("showAlert");

  withFunction.showModal = function(modalName: string) {
    return {
      type: "SHOW_MODAL_BY_NAME",
      payload: { modalName },
    };
  };
  withFunction.actionPaths.push("showModal");

  withFunction.closeModal = function(modalName: string) {
    return {
      type: "CLOSE_MODAL",
      payload: { modalName },
    };
  };
  withFunction.actionPaths.push("closeModal");

  withFunction.storeValue = function(
    key: string,
    value: string,
    persist = true,
  ) {
    return {
      type: "STORE_VALUE",
      payload: { key, value, persist },
    };
  };
  withFunction.actionPaths.push("storeValue");

  withFunction.download = function(data: string, name: string, type: string) {
    return {
      type: "DOWNLOAD",
      payload: { data, name, type },
    };
  };
  withFunction.actionPaths.push("download");

  withFunction.copyToClipboard = function(
    data: string,
    options?: { debug?: boolean; format?: string },
  ) {
    return {
      type: "COPY_TO_CLIPBOARD",
      payload: {
        data,
        options: { debug: options?.debug, format: options?.format },
      },
    };
  };
  withFunction.actionPaths.push("copyToClipboard");

  withFunction.resetWidget = function(
    widgetName: string,
    resetChildren = false,
  ) {
    return {
      type: "RESET_WIDGET_META_RECURSIVE_BY_NAME",
      payload: { widgetName, resetChildren },
    };
  };
  withFunction.actionPaths.push("resetWidget");

  return withFunction;
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
        property,
        value,
        entity,
        validation,
        tree,
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
  path: string,
) => {
  const { entityName, propertyPath } = getEntityNameAndPropertyPath(path);
  const logBlackList = _.get(dataTree, `${entityName}.logBlackList`, {});
  if (propertyPath && !(propertyPath in logBlackList)) {
    const existingErrors = _.get(
      dataTree,
      `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`,
      [],
    ) as EvaluationError[];
    _.set(
      dataTree,
      `${entityName}.${EVAL_ERROR_PATH}['${propertyPath}']`,
      existingErrors.concat(errors),
    );
  }
  return dataTree;
};

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (item: unknown): boolean => {
  return Object.prototype.toString.call(item) === "[object Object]";
};
