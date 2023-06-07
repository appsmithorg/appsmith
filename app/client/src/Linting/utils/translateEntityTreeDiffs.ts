import {
  getEntityNameAndPropertyPath,
  isTrueObject,
  translateCollectionDiffs,
} from "@appsmith/workers/Evaluation/evaluationUtils";
import { convertPathToString } from "@appsmith/workers/Evaluation/evaluationUtils";
import { DataTreeDiffEvent } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import type { TEntityTreeWithParsedJS } from "./linter";
import { isJSEntity } from "Linting/lib/entity";
import { isDynamicValue } from "utils/DynamicBindingUtils";
import { isNil } from "lodash";
import type { TEntityTree } from "./entityTree";

export type DataTreeDiff = {
  payload: {
    propertyPath: string;
    value?: unknown;
  };
  event: DataTreeDiffEvent;
};

export const translateDiffEventToDataTreeDiffEvent = (
  difference: Diff<TEntityTreeWithParsedJS>,
  entityTree: TEntityTree,
): DataTreeDiff | DataTreeDiff[] => {
  const propertyPath = convertPathToString(difference.path || []);
  let result: DataTreeDiff | DataTreeDiff[] = {
    payload: {
      propertyPath,
      value: "",
    },
    event: DataTreeDiffEvent.NOOP,
  };
  if (!difference.path) {
    return result;
  }

  const { entityName } = getEntityNameAndPropertyPath(propertyPath);
  const entity = entityTree[entityName];
  const isJSAction = isJSEntity(entity);

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
        typeof difference.rhs === "string" &&
        (isDynamicValue(difference.rhs) || isJSAction);

      const lhsChange =
        typeof difference.lhs === "string" &&
        (isDynamicValue(difference.lhs) || isJSAction);

      if (rhsChange || lhsChange) {
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

        const dataTreeDeleteDiffs = translateCollectionDiffs(
          propertyPath,
          difference.lhs,
          DataTreeDiffEvent.DELETE,
        );
        result = result.concat(dataTreeDeleteDiffs);
      } else if (difference.lhs === undefined || difference.rhs === undefined) {
        // Handle static value changes that change structure that can lead to
        // old bindings being eligible
        if (difference.lhs === undefined && !isNil(difference.rhs)) {
          result.event = DataTreeDiffEvent.NEW;
          result.payload = { propertyPath };
        }
        if (difference.rhs === undefined && !isNil(difference.lhs)) {
          result = [
            {
              event: DataTreeDiffEvent.EDIT,
              payload: {
                propertyPath,
                value: difference.rhs,
              },
            },
          ];

          const dataTreeDeleteDiffs = translateCollectionDiffs(
            propertyPath,
            difference.lhs,
            DataTreeDiffEvent.DELETE,
          ) as DataTreeDiff[];

          result = dataTreeDeleteDiffs.concat(result);
        }
      } else if (
        isTrueObject(difference.lhs) &&
        !isTrueObject(difference.rhs)
      ) {
        // This will happen for static value changes where a property went
        // from being an object to any other type like string or number
        // in such a case we want to delete all nested paths of the
        // original lhs object

        result = translateCollectionDiffs(
          propertyPath,
          difference.lhs,
          DataTreeDiffEvent.DELETE,
        );

        // when an object is being replaced by an array
        // list all new array accessors that are being added
        // so dependencies will be created based on existing bindings
        if (Array.isArray(difference.rhs)) {
          result = result.concat(
            translateCollectionDiffs(
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
        result = translateCollectionDiffs(
          propertyPath,
          difference.rhs,
          DataTreeDiffEvent.NEW,
        );

        // when an array is being replaced by an object
        // remove all array accessors that are deleted
        // so dependencies by existing bindings are removed
        if (Array.isArray(difference.lhs)) {
          result = result.concat(
            translateCollectionDiffs(
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
        entityTree,
      );
    }
    default: {
      break;
    }
  }
  return result;
};
