import { serialiseToBigInt } from "ee/workers/Evaluation/evaluationUtils";
import type { WidgetEntity } from "ee//entities/DataTree/types";
import type { Diff } from "deep-diff";
import { applyChange, diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import equal from "fast-deep-equal";
import { get, isObject, set } from "lodash";
import { isMoment } from "moment";
import { EvalErrorTypes, type EvalError } from "utils/DynamicBindingUtils";
import { create } from "mutative";
export const fn_keys: string = "__fn_keys__";
import { klona } from "klona/json";
import type DataTreeEvaluator from "workers/common/DataTreeEvaluator";

export const uniqueOrderUpdatePaths = (updatePaths: string[]) =>
  Array.from(new Set(updatePaths)).sort((a, b) => b.length - a.length);

export const getNewDataTreeUpdates = (paths: string[], dataTree: object) =>
  paths.map((path) => {
    const segmentedPath = path.split(".");

    return {
      kind: "N",
      path: segmentedPath,
      rhs: get(dataTree, segmentedPath),
    };
  });

export interface DiffNewTreeState {
  kind: "newTree";
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rhs: any;
}
export type DiffWithNewTreeState = Diff<DataTree, DataTree> | DiffNewTreeState;
// Finds the first index which is a duplicate value
// Returns -1 if there are no duplicates
// Returns the index of the first duplicate entry it finds

// Note: This "can" fail if the object entries don't have their properties in the
// same order.
export const findDuplicateIndex = (arr: Array<unknown>) => {
  const _uniqSet = new Set();
  let currSetSize = 0;

  for (let i = 0; i < arr.length; i++) {
    // JSON.stringify because value can be objects
    _uniqSet.add(JSON.stringify(arr[i]));

    if (_uniqSet.size > currSetSize) currSetSize = _uniqSet.size;
    else return i;
  }

  return -1;
};

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} subString            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 * @param {Number | null} [maxLimit]  Optional. (Default:null)
 */
export const countOccurrences = (
  string: string,
  subString: string,
  allowOverlapping = false,
  maxLimit: number | null = null,
): number => {
  string += "";
  subString += "";

  if (subString.length <= 0) return string.length + 1;

  let n = 0, // count of occurrences
    pos = 0; // current position of the pointer
  const step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);

    if (pos >= 0) {
      ++n;

      /**
       * If you are only interested in knowing
       * whether occurances count exceeds maxLimit,
       * then break the loop.
       */
      if (maxLimit && n > maxLimit) break;

      pos += step;
    } else break;
  }

  return n;
};

const LARGE_COLLECTION_SIZE = 100;

export const stringifyFnsInObject = (
  userObject: Record<string, unknown>,
): Record<string, unknown> => {
  const paths: string[] = parseFunctionsInObject(userObject);
  const fnStrings: string[] = [];

  for (const path of paths) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fnValue: any = get(userObject, path);

    fnStrings.push(fnValue.toString());
  }

  const output = JSON.parse(JSON.stringify(userObject));

  for (const [index, parsedFnString] of fnStrings.entries()) {
    set(output, paths[index], parsedFnString);
  }

  output[fn_keys] = paths;

  return output;
};

const constructPath = (existingPath: string, suffix: string): string => {
  if (existingPath.length > 0) {
    return `${existingPath}.${suffix}`;
  } else {
    return suffix;
  }
};

const parseFunctionsInObject = (
  userObject: Record<string, unknown>,
  paths: string[] = [],
  path: string = "",
): string[] => {
  if (Array.isArray(userObject)) {
    for (let i = 0; i < userObject.length; i++) {
      const arrayValue = userObject[i];

      if (typeof arrayValue == "function") {
        paths.push(constructPath(path, `[${i}]`));
      } else if (typeof arrayValue == "object") {
        parseFunctionsInObject(
          arrayValue,
          paths,
          constructPath(path, `[${i}]`),
        );
      }
    }
  } else {
    const keys = Object.keys(userObject);

    for (const key of keys) {
      const value = userObject[key];

      if (typeof value == "function") {
        paths.push(constructPath(path, key));
      } else if (typeof value == "object") {
        parseFunctionsInObject(
          value as Record<string, unknown>,
          paths,
          constructPath(path, key),
        );
      }
    }
  }

  return paths;
};

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isLargeCollection = (val: any) => {
  if (!Array.isArray(val)) return false;

  const rowSize = !isObject(val[0]) ? 1 : Object.keys(val[0]).length;

  const size = val.length * rowSize;

  return size > LARGE_COLLECTION_SIZE;
};

export const getReducedDataTrees = (
  oldDataTree: DataTree,
  newDataTree: DataTree,
  constrainedDiffPaths: string[],
): { oldData: DataTree; newData: DataTree } => {
  // Create base trees with error information
  const oldWithErrors = Object.keys(oldDataTree).reduce(
    (acc: Record<string, unknown>, key: string) => {
      const widgetValue = oldDataTree[key] as WidgetEntity;

      acc[key] = {
        __evaluation__: {
          errors: widgetValue.__evaluation__?.errors,
        },
      };

      return acc;
    },
    {},
  );

  const newWithErrors = Object.keys(newDataTree).reduce(
    (acc: Record<string, unknown>, key: string) => {
      const widgetValue = newDataTree[key] as WidgetEntity;

      acc[key] = {
        __evaluation__: {
          errors: widgetValue.__evaluation__?.errors,
        },
      };

      return acc;
    },
    {},
  );

  // Process each path
  constrainedDiffPaths.forEach((path: string) => {
    if (path.length === 0) return;

    const pathParts = path.split(".");

    while (pathParts.length > 0) {
      if (pathParts.length === 1) {
        const newValue = get(newDataTree, pathParts);
        const oldValue = get(oldDataTree, pathParts);

        if (newValue === undefined && oldValue === undefined) {
          break;
        }

        if (newValue !== undefined && oldValue !== undefined) {
          set(newWithErrors, pathParts, newValue);
          set(oldWithErrors, pathParts, oldValue);
          break;
        }

        newValue !== undefined
          ? set(newWithErrors, pathParts, newValue)
          : set(oldWithErrors, pathParts, oldValue);
        break;
      }

      const newValue = get(newDataTree, pathParts);
      const oldValue = get(oldDataTree, pathParts);

      // found a defined ancestor
      if (newValue !== undefined && oldValue !== undefined) {
        set(newWithErrors, pathParts, newValue);
        set(oldWithErrors, pathParts, oldValue);
        break;
      }

      pathParts.pop();
    }
  });

  return {
    oldData: oldWithErrors as DataTree,
    newData: newWithErrors as DataTree,
  };
};

const generateDiffUpdates = (
  oldDataTree: DataTree,
  dataTree: DataTree,
  constrainedDiffPaths: string[],
): Diff<DataTree, DataTree>[] => {
  const attachDirectly: Diff<DataTree, DataTree>[] = [];
  const attachLater: Diff<DataTree, DataTree>[] = [];

  // Get reduced data trees for both old and new states
  const { newData, oldData } = getReducedDataTrees(
    oldDataTree,
    dataTree,
    constrainedDiffPaths,
  );

  const updates =
    diff(oldData, newData, (path, key) => {
      if (!path.length || key === "__evaluation__") return false;

      const segmentedPath = [...path, key];

      const rhs = get(dataTree, segmentedPath) as DataTree;

      const lhs = get(oldDataTree, segmentedPath) as DataTree;

      //when a moment value changes we do not want the inner moment object updates, we just want the ISO result of it
      // which we get during the serialisation process we perform at latter steps
      if (isMoment(rhs)) {
        attachDirectly.push({
          kind: "E",
          lhs,
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rhs: rhs as any,
          path: segmentedPath,
        });

        // ignore trying to diff moment objects
        return true;
      }

      if (rhs === undefined) {
        //if an undefined value is being set it should be a delete
        if (lhs !== undefined) {
          attachDirectly.push({ kind: "D", lhs, path: segmentedPath });
        }

        return true;
      }

      const isLhsLarge = isLargeCollection(lhs);
      const isRhsLarge = isLargeCollection(rhs);

      if (!isLhsLarge && !isRhsLarge) {
        //perform diff on this node
        return false;
      }

      //if either of values are large just directly attach it don't have to generate very granular updates

      if ((!isLhsLarge && isRhsLarge) || (isLhsLarge && !isRhsLarge)) {
        attachDirectly.push({ kind: "N", path: segmentedPath, rhs });

        return true;
      }

      //if the values are different attach the update directly
      !equal(lhs, rhs) &&
        attachDirectly.push({ kind: "N", path: segmentedPath, rhs });

      //ignore diff on this node
      return true;
    }) || [];

  const largeDataSetUpdates = [...attachDirectly, ...attachLater];

  return [...updates, ...largeDataSetUpdates];
};

const correctUndefinedUpdatesToDeletesOrNew = (
  updates: Diff<DataTree, DataTree>[],
) =>
  updates.reduce(
    (acc, update) => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { kind, lhs, path, rhs } = update as any;

      if (kind === "E") {
        if (lhs === undefined && rhs !== undefined) {
          acc.push({ kind: "N", path, rhs });
        }

        if (lhs !== undefined && rhs === undefined) {
          acc.push({ path, lhs, kind: "D" });
        }

        if (lhs !== undefined && rhs !== undefined) {
          acc.push(update);
        }

        return acc;
      }

      acc.push(update);

      return acc;
    },
    [] as Diff<DataTree, DataTree>[],
  );

// whenever an element in a collection is set to undefined, we need to send the entire collection as an update
const generateRootWidgetUpdates = (
  updates: Diff<DataTree, DataTree>[],
  newDataTree: DataTree,
  oldDataTree: DataTree,
): Diff<DataTree, DataTree>[] =>
  updates
    .filter(
      (v) =>
        v.kind === "D" &&
        v.path &&
        typeof v.path[v.path.length - 1] === "number",
    )
    .map(
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ path }: any) => {
        const pathCopy = [...path];

        pathCopy.pop();

        return {
          kind: "E",
          path: pathCopy,
          lhs: get(oldDataTree, pathCopy) as DataTree,
          rhs: get(newDataTree, pathCopy) as DataTree,
        }; //push the parent path
      },
      [] as Diff<DataTree, DataTree>[],
    );

// when a root collection is updated, we need to scrub out updates that are inside the root collection
const getScrubbedOutUpdatesWhenRootCollectionIsUpdated = (
  updates: Diff<DataTree, DataTree>[],
  rootCollectionUpdates: Diff<DataTree, DataTree>[],
) => {
  const rootCollectionPaths = rootCollectionUpdates
    .filter((update) => update?.path?.length)
    .map((update) => (update.path as string[]).join("."));

  return (
    updates // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((update: any) => ({ update, condensedPath: update.path.join(".") }))
      .filter(
        ({ condensedPath }) =>
          !rootCollectionPaths.some((p) => condensedPath.startsWith(p)),
      )
      // remove the condensedPath from the update
      .map(({ update }) => update)
  );
};

export const generateOptimisedUpdates = (
  oldDataTree: DataTree,
  dataTree: DataTree,
  // these are the paths that the diff is limited to, this is a performance optimisation and through this we don't have to diff the entire data tree
  constrainedDiffPaths: string[],
): Diff<DataTree, DataTree>[] => {
  const updates = generateDiffUpdates(
    oldDataTree,
    dataTree,
    constrainedDiffPaths,
  );
  const correctedUpdates = correctUndefinedUpdatesToDeletesOrNew(updates);

  const rootCollectionUpdates = generateRootWidgetUpdates(
    correctedUpdates,
    dataTree,
    oldDataTree,
  );
  const scrubedOutUpdates = getScrubbedOutUpdatesWhenRootCollectionIsUpdated(
    correctedUpdates,
    rootCollectionUpdates,
  );

  return [...scrubedOutUpdates, ...rootCollectionUpdates];
};

export const generateSerialisedUpdates = (
  prevState: DataTree,
  currentState: DataTree,
  constrainedDiffPaths: string[],
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergeAdditionalUpdates?: any,
): {
  serialisedUpdates: string;
  updates: Diff<DataTree, DataTree>[];
  error?: EvalError;
} => {
  const updates = generateOptimisedUpdates(
    prevState,
    currentState,
    constrainedDiffPaths,
  );

  //remove lhs from diff to reduce the size of diff upload,
  //it is not necessary to send lhs and we can make the payload to transfer to the main thread smaller for quicker transfer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  let removedLhs = updates.map(({ lhs, ...rest }: any) => rest);

  removedLhs = [...removedLhs, ...(mergeAdditionalUpdates || [])];

  try {
    // serialise bigInt values and convert the updates to a string over here to minismise the cost of transfer
    // to the main thread. In the main thread parse this object there.
    return { serialisedUpdates: serialiseToBigInt(removedLhs), updates };
  } catch (error) {
    return {
      serialisedUpdates: "[]",
      updates: [],
      error: {
        type: EvalErrorTypes.SERIALIZATION_ERROR,
        message: (error as Error).message,
        stack: (error as Error).stack,
      },
    };
  }
};

export function generateOptimisedUpdatesAndSetPrevState(
  dataTree: DataTree,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTreeEvaluator: any,
  affectedNodePaths: string[],
  additionalUpdates?: Diff<DataTree, DataTree>[],
  isUpdateCycle?: boolean,
): string {
  const { error, serialisedUpdates } = generateSerialisedUpdates(
    dataTreeEvaluator?.getPrevState() || {},
    dataTree,
    affectedNodePaths,
    additionalUpdates,
  );

  if (error && dataTreeEvaluator?.errors) {
    dataTreeEvaluator.errors.push(error);
  }

  updatePrevState(
    isUpdateCycle,
    dataTreeEvaluator,
    serialisedUpdates,
    dataTree,
  );

  return serialisedUpdates;
}

export function updatePrevState(
  isUpdateCycle: boolean | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataTreeEvaluator: any,
  serialisedUpdates: string,
  dataTree: DataTree,
): void {
  const updates = JSON.parse(serialisedUpdates);

  if (isUpdateCycle) {
    const updatedState = create(dataTreeEvaluator?.getPrevState(), (draft) => {
      updates.forEach((update: Diff<DataTree, DataTree>) => {
        try {
          applyChange(draft, undefined, update);
        } catch (e) {
          const error = e as Error;

          // Push error to dataTreeEvaluator.errors with just the error message
          if (dataTreeEvaluator?.errors) {
            dataTreeEvaluator.errors.push({
              type: EvalErrorTypes.UPDATE_DATA_TREE_ERROR,
              message: error.message,
              stack: error.stack,
            });
          }
        }
      });
    });

    dataTreeEvaluator?.setPrevState(updatedState);
  } else {
    dataTreeEvaluator?.setPrevState(dataTree);
  }
}

export function updateEvalProps(dataTreeEvaluator: DataTreeEvaluator) {
  if (!dataTreeEvaluator) return null;

  const evalProps = dataTreeEvaluator.evalProps;

  return create(dataTreeEvaluator.evalTree, (draft) => {
    for (const [entityName, entityEvalProps] of Object.entries(evalProps)) {
      if (!entityEvalProps.__evaluation__) continue;

      set(
        draft[entityName],
        "__evaluation__",
        klona({
          errors: entityEvalProps.__evaluation__.errors,
        }),
      );
    }
  });
}
