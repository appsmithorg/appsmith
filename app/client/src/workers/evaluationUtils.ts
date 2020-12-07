import {
  isDynamicValue,
  getEntityDynamicBindingPathList,
} from "../utils/DynamicBindingUtils";
import { DataTree, DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import { Diff } from "deep-diff";
import { DependencyMap } from "./evaluation.worker";
import _ from "lodash";

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

export const convertPathToString = (arrPath: Array<string | number>) => {
  let string = "";
  arrPath.forEach(segment => {
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

export const isPropertyPathOrNestedPath = (
  path: string,
  comparePath: string,
): boolean => {
  return path === comparePath || comparePath.startsWith(`${path}.`);
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
  parentPaths.forEach(propertyPath => {
    withNestedPaths.add(propertyPath);
    dependantNodes
      .filter(dependantNodePath =>
        isPropertyPathOrNestedPath(propertyPath, dependantNodePath),
      )
      .forEach(dependantNodePath => {
        inverseMap[dependantNodePath].forEach(path => {
          withNestedPaths.add(path);
        });
      });
  });
  return [...withNestedPaths.values()];
};

// Todo: figure what we're going to do about multi-level dependencies and resulting circular dep and implemented a nested version.
export const makeParentsDependOnChildren = (
  dependencyMap: DependencyMap,
  dataTree: DataTree,
) => {
  const flatValues = Array.from(
    new Set<string>(_.flatten(Object.values(dependencyMap))),
  );
  flatValues
    .filter(k => !k.includes("."))
    .forEach(entityName => {
      const entity = dataTree[entityName];
      const children = getEntityDynamicBindingPathList(
        entity as DataTreeWidget,
      );

      const existing = dependencyMap[entityName] || [];
      existing.push(...children.map(child => `${entityName}.${child.key}`));
      dependencyMap[entityName] = Array.from(new Set<string>(existing));
    });
};

/**
 *
 * @param depMap
 * @param child
 */
export const makeParentsDependOnChild = (
  depMap: DependencyMap,
  child: string,
): DependencyMap => {
  const result: DependencyMap = depMap;
  let curKey = child;
  const rgx = /^(.*)\..*$/;
  let matches: Array<string> | null;
  // Note: The `=` is intentional
  // Stops looping when match is null
  while ((matches = curKey.match(rgx)) !== null) {
    const parentKey = matches[1];
    // Todo: switch to set everywhere
    result[parentKey] = result[parentKey] || [];
    result[parentKey].push(curKey); //
    curKey = parentKey;
  }
  return result;
};

export class CrashingError extends Error {}
