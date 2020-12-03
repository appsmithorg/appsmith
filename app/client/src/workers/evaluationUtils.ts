import { DataTree } from "../entities/DataTree/dataTreeFactory";
import { isDynamicValue } from "../utils/DynamicBindingUtils";
import { Diff } from "deep-diff";
import { DependencyMap } from "./evaluation.worker";

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
