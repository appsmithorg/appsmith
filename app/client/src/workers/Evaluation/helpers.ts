import { diff } from "deep-diff";
import equal from "fast-deep-equal";
import { get, isNumber, isObject } from "lodash";

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
) =>
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
) => {
  const attachDirectly: any = [];
  const ignoreLargeKeysHasBeenAttached = new Set();
  const attachLater: any = [];
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

      const isLhsLarge = isLargeCollection(lhs);
      const isRhsLarge = isLargeCollection(rhs);
      if (!isLhsLarge && !isRhsLarge) {
        //perform diff on this node
        return false;
      }

      //if either of values are large just directly attach it don't have to generate very granular updates

      if ((!isLhsLarge && isRhsLarge) || (isLhsLarge && !isRhsLarge)) {
        attachDirectly.push({ path: segmentedPath, rhs });
        return true;
      }

      //if the values are different attach the update directly
      !equal(lhs, rhs) && attachDirectly.push({ path: segmentedPath, rhs });

      //ignore diff on this node
      return true;
    }) || [];

  const missingSetPaths = generateMissingSetPathsUpdates(
    ignoreLargeKeys,
    ignoreLargeKeysHasBeenAttached,
    dataTree,
  );

  const largeDataSetUpdates = [
    ...attachDirectly.map((val: any) => ({ kind: "N", ...val })),
    ...missingSetPaths,
    ...attachLater,
  ];
  return [...updates, ...largeDataSetUpdates];
};

export const generateOptimisedUpdates = (
  oldDataTree: any,
  dataTree: any,
  identicalEvalPathsPatches?: any,
): any => {
  const ignoreLargeKeys = normaliseEvalPath(identicalEvalPathsPatches);
  const updates = generateDiffUpdates(oldDataTree, dataTree, ignoreLargeKeys);
  return updates;
};
