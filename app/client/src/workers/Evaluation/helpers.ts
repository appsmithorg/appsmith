import { serialiseToBigInt } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import equal from "fast-deep-equal";
import { get, isObject, set } from "lodash";
import { isMoment } from "moment";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";

export const fn_keys: string = "__fn_keys__";

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

const isLargeCollection = (val: any) => {
  if (!Array.isArray(val)) return false;
  const rowSize = !isObject(val[0]) ? 1 : Object.keys(val[0]).length;

  const size = val.length * rowSize;

  return size > LARGE_COLLECTION_SIZE;
};

const getReducedDataTree = (data: any, constrainedDiffPaths: string[]) => {
  const withErrors = Object.keys(data).reduce((acc: any, key) => {
    const widgetValue = data[key];
    acc[key] = {
      __evaluation__: {
        errors: widgetValue.__evaluation__?.errors,
      },
    };
    return acc;
  }, {});
  return constrainedDiffPaths.reduce((acc: any, key: any) => {
    set(acc, key, get(data, key));
    return acc;
  }, withErrors);
};
const generateDiffUpdates = (
  oldDataTree: any,
  dataTree: any,
  constrainedDiffPaths: string[],
): DiffWithNewTreeState[] => {
  const attachDirectly: DiffWithNewTreeState[] = [];
  const attachLater: DiffWithNewTreeState[] = [];

  const oldData = getReducedDataTree(oldDataTree, constrainedDiffPaths);
  const newData = getReducedDataTree(dataTree, constrainedDiffPaths);
  const updates =
    diff(oldData, newData, (path, key) => {
      if (!path.length || key === "__evaluation__") return false;

      const segmentedPath = [...path, key];
      const rhs = get(dataTree, segmentedPath);

      const lhs = get(oldDataTree, segmentedPath);

      //when a moment value changes we do not want the inner moment object updates, we just want the ISO result of it
      // which we get during the serialisation process we perform at latter steps
      if (isMoment(rhs)) {
        attachDirectly.push({
          kind: "E",
          lhs,
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
  updates: DiffWithNewTreeState[],
) =>
  updates.reduce((acc, update) => {
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
  }, [] as DiffWithNewTreeState[]);

// whenever an element in a collection is deleted, we need to send the entire as an update
const generateRootWidgetUpdates = (
  updates: DiffWithNewTreeState[],
  newDataTree: any,
) =>
  updates
    .filter(
      (v) =>
        v.kind === "D" &&
        v.path &&
        typeof v.path[v.path.length - 1] === "number",
    )
    .map(({ path }: any) => {
      const pathCopy = [...path];
      pathCopy.pop();
      return {
        kind: "E",
        path: pathCopy,
        rhs: get(newDataTree, pathCopy),
      }; //push the parent path
    }, [] as DiffWithNewTreeState[]);

export const generateOptimisedUpdates = (
  oldDataTree: any,
  dataTree: any,
  constrainedDiffPaths: string[],
): DiffWithNewTreeState[] => {
  const updates = generateDiffUpdates(
    oldDataTree,
    dataTree,
    constrainedDiffPaths,
  );
  const correctedUpdates = correctUndefinedUpdatesToDeletesOrNew(updates);

  const rootCollectionUpdates = generateRootWidgetUpdates(
    correctedUpdates,
    dataTree,
  );
  const rootCollectionPaths = rootCollectionUpdates.map((update) =>
    update.path.join("."),
  );
  const scrubedOutUpdates = correctedUpdates
    .map((update: any) => ({ update, condensedPath: update.path.join(".") }))
    .filter(
      ({ condensedPath }) =>
        !rootCollectionPaths.some((p) => condensedPath.startsWith(p)),
    )
    // remove the condensedPath from the update
    .map(({ update }) => update);

  return [
    ...scrubedOutUpdates,
    ...rootCollectionUpdates,
  ] as DiffWithNewTreeState[];
};

export const generateSerialisedUpdates = (
  prevState: any,
  currentState: any,
  constrainedDiffPaths: string[],
  mergeAdditionalUpdates?: any,
): {
  serialisedUpdates: string;
  error?: { type: string; message: string };
} => {
  const updates = generateOptimisedUpdates(
    prevState,
    currentState,
    constrainedDiffPaths,
  );

  //remove lhs from diff to reduce the size of diff upload,
  //it is not necessary to send lhs and we can make the payload to transfer to the main thread smaller for quicker transfer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let removedLhs = updates.map(({ lhs, ...rest }: any) => rest);
  removedLhs = [...removedLhs, ...(mergeAdditionalUpdates || [])];

  try {
    // serialise bigInt values and convert the updates to a string over here to minismise the cost of transfer
    // to the main thread. In the main thread parse this object there.
    return { serialisedUpdates: serialiseToBigInt(removedLhs) };
  } catch (error) {
    return {
      serialisedUpdates: "[]",
      error: {
        type: EvalErrorTypes.SERIALIZATION_ERROR,
        message: (error as Error).message,
      },
    };
  }
};

export const generateOptimisedUpdatesAndSetPrevState = (
  dataTree: any,
  dataTreeEvaluator: any,
  constrainedDiffPaths: string[],
  mergeAdditionalUpdates?: any,
) => {
  const { error, serialisedUpdates } = generateSerialisedUpdates(
    dataTreeEvaluator.getPrevState(),
    dataTree,
    constrainedDiffPaths,
    mergeAdditionalUpdates,
  );

  if (error) {
    dataTreeEvaluator.errors.push(error);
  }
  dataTreeEvaluator?.setPrevState(dataTree);
  return serialisedUpdates;
};
