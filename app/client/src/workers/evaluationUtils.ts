import {
  DependencyMap,
  isDynamicValue,
  isChildPropertyPath,
} from "../utils/DynamicBindingUtils";
import { WidgetType } from "../constants/WidgetConstants";
import { WidgetProps } from "../widgets/BaseWidget";
import { WidgetTypeConfigMap } from "../utils/WidgetFactory";
import { VALIDATORS } from "./validations";
import { Diff } from "deep-diff";
import {
  DataTree,
  DataTreeAction,
  DataTreeEntity,
  DataTreeWidget,
  ENTITY_TYPE,
} from "../entities/DataTree/dataTreeFactory";
import _ from "lodash";

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
    if (typeof segment === "string") {
      if (string.length !== 0) {
        string = string + ".";
      }
      string = string + segment;
    } else {
      string = string + "[" + segment + "]";
    }
  });
  return string;
};

export const translateDiffEventToDataTreeDiffEvent = (
  difference: Diff<any, any>,
): DataTreeDiff => {
  const result: DataTreeDiff = {
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
      } else {
        // Handle static value changes that change structure that can lead to
        // old bindings being eligible
        if (
          difference.lhs === undefined &&
          typeof difference.rhs === "object"
        ) {
          result.event = DataTreeDiffEvent.NEW;
          result.payload = { propertyPath };
        }
        if (
          difference.rhs === undefined &&
          typeof difference.lhs === "object"
        ) {
          result.event = DataTreeDiffEvent.DELETE;
          result.payload = { propertyPath };
        }
      }

      break;
    }
    case "A": {
      break;
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
): Array<string> => {
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
  return [...withNestedPaths.values()];
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
    return JSON.parse(JSON.stringify(value));
  } else {
    return value;
  }
};

export const removeFunctionsFromDataTree = (dataTree: DataTree) => {
  dataTree.actionPaths?.forEach((functionPath) => {
    _.set(dataTree, functionPath, {});
  });
  delete dataTree.actionPaths;
  return dataTree;
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
  widgetConfigMap: WidgetTypeConfigMap,
  widgetType: WidgetType,
  property: string,
  value: any,
  props: WidgetProps,
  dataTree?: DataTree,
) {
  const propertyValidationTypes = widgetConfigMap[widgetType].validations;
  const validationTypeOrValidator = propertyValidationTypes[property];
  let validator;

  if (typeof validationTypeOrValidator === "function") {
    validator = validationTypeOrValidator;
  } else {
    validator = VALIDATORS[validationTypeOrValidator];
  }
  if (validator) {
    return validator(value, props, dataTree);
  } else {
    return { isValid: true, parsed: value };
  }
}

export function getValidatedTree(
  widgetConfigMap: WidgetTypeConfigMap,
  tree: DataTree,
) {
  return Object.keys(tree).reduce((tree, entityKey: string) => {
    const entity = tree[entityKey] as DataTreeWidget;
    if (!isWidget(entity)) {
      return tree;
    }
    const parsedEntity = { ...entity };
    Object.keys(entity).forEach((property: string) => {
      const validationProperties = widgetConfigMap[entity.type].validations;

      if (property in validationProperties) {
        const value = _.get(entity, property);
        // Pass it through parse
        const {
          parsed,
          isValid,
          message,
          transformed,
        } = validateWidgetProperty(
          widgetConfigMap,
          entity.type,
          property,
          value,
          entity,
          tree,
        );
        parsedEntity[property] = parsed;
        const evaluatedValue = isValid
          ? parsed
          : _.isUndefined(transformed)
          ? value
          : transformed;
        const safeEvaluatedValue = removeFunctions(evaluatedValue);
        _.set(parsedEntity, `evaluatedValues.${property}`, safeEvaluatedValue);
        if (!isValid) {
          _.set(parsedEntity, `invalidProps.${property}`, true);
          _.set(parsedEntity, `validationMessages.${property}`, message);
        } else {
          _.set(parsedEntity, `invalidProps.${property}`, false);
          _.set(parsedEntity, `validationMessages.${property}`, "");
        }
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
