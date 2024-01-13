import { serialiseToBigInt } from "@appsmith/workers/Evaluation/evaluationUtils";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import equal from "fast-deep-equal";
import { get, isNumber, isObject, set } from "lodash";
import { isMoment } from "moment";
import { EvalErrorTypes } from "utils/DynamicBindingUtils";

export const fn_keys: string = "__fn_keys__";

export interface DiffReferenceState {
  kind: "referenceState";
  path: any[];
  referencePath: string;
}
export type DiffWithReferenceState =
  | Diff<DataTree, DataTree>
  | DiffReferenceState;
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
// for object paths which have a "." in the object key like "a.['b.c']"
const REGEX_NESTED_OBJECT_PATH = /(.+)\.\[\'(.*)\'\]/;

const generateWithKey = (basePath: any, key: any) => {
  const segmentedPath = [...basePath, key];

  if (isNumber(key)) {
    return {
      path: basePath.join(".") + ".[" + key + "]",
      segmentedPath,
    };
  }
  if (key.includes(".")) {
    return {
      path: basePath.join(".") + ".['" + key + "']",
      segmentedPath,
    };
  }
  return {
    path: basePath.join(".") + "." + key,
    segmentedPath,
  };
};

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

const normaliseEvalPath = (identicalEvalPathsPatches: any) =>
  Object.keys(identicalEvalPathsPatches || {}).reduce(
    (acc: any, evalPath: string) => {
      //for object paths which have a "." in the object key like "a.['b.c']", we need to extract these
      // paths and break them to appropriate patch paths

      const matches = evalPath.match(REGEX_NESTED_OBJECT_PATH);
      if (!matches || !matches.length) {
        //regular paths like "a.b.c"
        acc[evalPath] = identicalEvalPathsPatches[evalPath];
        return acc;
      }

      const [, firstSeg, nestedPathSeg] = matches;
      // normalise non nested paths like "a.['b']"
      if (!nestedPathSeg.includes(".")) {
        const key = [firstSeg, nestedPathSeg].join(".");
        acc[key] = identicalEvalPathsPatches[evalPath];
        return acc;
      }
      // object paths which have a "." like "a.['b.c']"
      const key = [firstSeg, `['${nestedPathSeg}']`].join(".");
      acc[key] = identicalEvalPathsPatches[evalPath];
      return acc;
    },
    {},
  );
//completely new updates which the diff will not traverse through needs to be attached
const generateMissingSetPathsUpdates = (
  ignoreLargeKeys: any,
  ignoreLargeKeysHasBeenAttached: any,
  dataTree: any,
): DiffWithReferenceState[] =>
  Object.keys(ignoreLargeKeys)
    .filter((evalPath) => !ignoreLargeKeysHasBeenAttached.has(evalPath))
    .map((evalPath) => {
      const statePath = ignoreLargeKeys[evalPath];
      //for object paths which have a "." in the object key like "a.['b.c']", we need to extract these
      // paths and break them to appropriate patch paths

      //get the matching value from the widget properies in the data tree
      const val = get(dataTree, statePath);

      const matches = evalPath.match(REGEX_NESTED_OBJECT_PATH);
      if (!matches || !matches.length) {
        //regular paths like "a.b.c"

        return {
          kind: "N",
          path: evalPath.split("."),
          rhs: val,
        };
      }
      // object paths which have a "." like "a.['b.c']"
      const [, firstSeg, nestedPathSeg] = matches;
      const segmentedPath = [...firstSeg.split("."), nestedPathSeg];

      return {
        kind: "N",
        path: segmentedPath,
        rhs: val,
      };
    });

const generateDiffUpdates = (
  oldDataTree: any,
  dataTree: any,
  ignoreLargeKeys: any,
): DiffWithReferenceState[] => {
  const attachDirectly: DiffWithReferenceState[] = [];
  const ignoreLargeKeysHasBeenAttached = new Set();
  const attachLater: DiffWithReferenceState[] = [];
  const updates =
    diff(oldDataTree, dataTree, (path, key) => {
      if (!path.length || key === "__evaluation__") return false;

      const { path: setPath, segmentedPath } = generateWithKey(path, key);

      // if ignore path is present...this segment of code generates the data compression patches
      if (!!ignoreLargeKeys[setPath]) {
        const originalStateVal = get(oldDataTree, segmentedPath);
        const correspondingStatePath = ignoreLargeKeys[setPath];
        const statePathValue = get(dataTree, correspondingStatePath);
        if (!equal(originalStateVal, statePathValue)) {
          //reference state patches are a patch that does not have a patch value but it provides a path which contains the same value
          //this is helpful in making the payload sent to the main thread small
          attachLater.push({
            kind: "referenceState",
            path: segmentedPath,
            referencePath: correspondingStatePath,
          });
        }
        ignoreLargeKeysHasBeenAttached.add(setPath);
        return true;
      }
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
        // if the lhs is also undefined ignore diff on this node
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

  const missingSetPaths = generateMissingSetPathsUpdates(
    ignoreLargeKeys,
    ignoreLargeKeysHasBeenAttached,
    dataTree,
  );

  const largeDataSetUpdates = [
    ...attachDirectly,
    ...missingSetPaths,
    ...attachLater,
  ];
  return [...updates, ...largeDataSetUpdates];
};

export const generateOptimisedUpdates = (
  oldDataTree: any,
  dataTree: any,
  identicalEvalPathsPatches?: Record<string, string>,
): DiffWithReferenceState[] => {
  const ignoreLargeKeys = normaliseEvalPath(identicalEvalPathsPatches);
  const updates = generateDiffUpdates(oldDataTree, dataTree, ignoreLargeKeys);
  return updates;
};

export const generateSerialisedUpdates = (
  prevState: any,
  currentState: any,
  identicalEvalPathsPatches: any,
): {
  serialisedUpdates: string;
  error?: { type: string; message: string };
} => {
  const updates = generateOptimisedUpdates(
    prevState,
    currentState,
    identicalEvalPathsPatches,
  );

  //remove lhs from diff to reduce the size of diff upload,
  //it is not necessary to send lhs and we can make the payload to transfer to the main thread smaller for quicker transfer
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removedLhs = updates.map(({ lhs, ...rest }: any) => rest);

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
) => {
  const identicalEvalPathsPatches =
    dataTreeEvaluator?.getEvalPathsIdenticalToState();

  const { error, serialisedUpdates } = generateSerialisedUpdates(
    dataTreeEvaluator.getPrevState(),
    dataTree,
    identicalEvalPathsPatches,
  );

  if (error) {
    dataTreeEvaluator.errors.push(error);
  }
  dataTreeEvaluator?.setPrevState(dataTree);
  return serialisedUpdates;
};
