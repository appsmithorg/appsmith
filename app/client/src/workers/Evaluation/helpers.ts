import { FOCUSABLE_SELECTOR } from "@testing-library/user-event/dist/utils";
import type { ValidationConfig } from "constants/PropertyControlConstants";
import type { Diff } from "deep-diff";
import { diff } from "deep-diff";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import equal from "fast-deep-equal";
import produce from "immer";
import { get, isNumber, isObject, set } from "lodash";
import { invalid } from "moment";
import { check } from "prettier";
import { Arr } from "tern";
import { VALIDATORS } from "./validations";
import type { ValidationResponse } from "constants/WidgetValidation";
import { array } from "toposort";
import { isValid } from "redux-form";
import type { ValidateResult } from "react-hook-form";
import { parse } from "json5";
import { klona } from "klona";
const detect = require('acorn-globals');

export const fn_keys : string = "__fn_keys__"

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

// export const validateFunctionsInArray = (userArray: unknown[], allowedGlobals: string[], parentObj: Record<string, unknown>, path: string = "") => {
//   const invalidResponse : ValidationResponse = { isValid: false, parsed: {}, messages: [] }

//   for(let index = 0; index < userArray.length; index = index + 1) {
//     const val = userArray[index]
//     const fnKeys = parentObj[fn_keys] as string[]
//     const newPath = path.length > 0 ? `${path.slice()}.[${index}]` : `[${index}]`

//     if(typeof(val) == "object") {
//       const valueAsRecord = val as Record<string, unknown>  
//       const result = validateFunctionsInObject(valueAsRecord, allowedGlobals, parentObj, newPath)
//       if (!result.isValid) {
//         return invalidResponse
//       }
//     } else if(typeof(val) == 'function') {
//       const result = isValidFunction(val, allowedGlobals)
//       if(!result.isValid) {
//         return invalidResponse
//       } else {
//         userArray[index] = result.parsed
//         console.log("****", "pushing value to fn key in array", newPath)
//         fnKeys.push(newPath)
//       }
//     }
//   }
//   return { isValid: true, parsed: userArray, messages: []}
// }

// a = {
//   fn_keys: [b.c]
//   b: {
//     c: "rajat"
//   }
// }

export const validateFunctionsInObject = (userObject: Record<string, unknown>,
  allowedGlobals: string[],
  parentObj: Record<string, unknown> | undefined = undefined,
  path : string = "") : ValidationResponse => {
    const paths : string[] = parseFunctionsInObject(userObject)
    let error : Error[] = []
    let fnStrings: string[] = []

    for (const path of paths) {
      const fnValue = get(userObject, path)
      console.log("*********", "going to validate function ", fnValue, path)
      const result = isValidFunction(fnValue, allowedGlobals)

      // const result = { isValid: false, parsed: "", messages: [] }

      if (!result.isValid) {
        error = result.messages ?? []
        break;
      } else {
        fnStrings.push(result.parsed)
      }
    }

    if (error.length > 0) {
      return { isValid: false, parsed: {}, messages: error}
    }

    const parsed = JSON.parse(JSON.stringify(userObject)) 
    // console.log("******", "the original object after parsing is ", parsed)
    if (fnStrings.length > 0) {
      for (const [index, parsedFnString] of fnStrings.entries()) {
        set(parsed, paths[index], parsedFnString)
      }
      parsed[fn_keys] = paths
    }
    console.log("******", "the original object after substitution is ", parsed)
    return { isValid: true, parsed: parsed, messages: []}
}

const constructPath = (existingPath : string, suffix: string) : string => {
  if (existingPath.length > 0) {
    return `${existingPath}.${suffix}`
  } else {
    return suffix
  }
}

export const parseFunctionsInObject = (userObject: Record<string, unknown>, paths : string[] = [], path: string = "") : string[]=> {
  const keys = Object.keys(userObject)
  for (const key of keys) {
    const value = userObject[key]
      if (typeof(value) == "function") {
        paths.push(constructPath(path, key))
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          const arrayValue = value[i]          
          if (typeof(arrayValue) == "function") {
            paths.push(constructPath(path, `${key}.[${i}]`))
          } else if (typeof(arrayValue) == "object") {
            parseFunctionsInObject(arrayValue, paths, constructPath(path, `${key}.[${i}]`))
          }
        }
      } else if (typeof(value) == "object") {
        parseFunctionsInObject(value as Record<string, unknown>, paths, constructPath(path, key))
      }
  }
  return paths;
}

// export const validateFunctionsInObjectHelper = (userObj: Record<string, unknown>,
//   allowedGlobals: string[],
//   parentObj: Record<string, unknown> | undefined = undefined,
//   path : string = "") : ValidationResponse => {

//   const invalidResponse : ValidationResponse = { isValid: false, parsed: {}, messages: [] }
//   let fnKeys : string[] = []

//   try {
//     if (!parentObj) {
//       console.log("****", "receving value for function validation is ", userObj)
//       parentObj = userObj
//       parentObj[fn_keys] = ["rajatagrawal"]
//     }
//     console.log("****", "parent obj during initialization is ", parentObj)
//     const finalResult = { isValid: true, parsed: parentObj, messages: []}
  
//     // if (Array.isArray(userObj)) {
//     //   const result = validateFunctionsInArray(userObj, allowedGlobals, parentObj, path)
//     //   if (!result.isValid) {
//     //     return invalidResponse
//     //   }
//     // } else {
//       const keys = Object.keys(userObj)
  
//       for (const key of keys) {
//         if (key == fn_keys) {
//           continue;
//         }
  
//         const value = userObj[key]
//         if (typeof(value) == "function") {
//           const result = isValidFunction(value, allowedGlobals)
//           if (!result.isValid) {
//             return { isValid: false, messages: result.messages, parsed: {}}
//           } else {
//             userObj[key] = result.parsed
            
//             const fnKeys = parentObj[fn_keys] as string[]
  
//             let valuePath : string = path
//             if (path.length > 0) {
//               valuePath = `${path.slice()}.${key}`
//             } else {
//               valuePath = `${key}`
//             }
//             // const valuePath : string = path.length > 0 ? `${path.slice()}.${key}` : `${key}`;
            
//             fnKeys.push(valuePath)
//             // console.log("****", "parent object before pushing value is ", parentObj[__fn_keys__])
//             // (parentObj[fn_keys] as string[]).push("randommmm")
//             // fnKeys.push("randommmm")
//             console.log("****", "fn key after pushing is ", fnKeys)
//             console.log("****", "parent object after pushing value is ", parentObj[fn_keys])
//           }
//         }
//         else if (typeof(value) == "object") {
//           const newPath = path.length > 0 ? `${path.slice()}.${key}` : `${key}`
//           const result = validateFunctionsInObject(value as Record<string, unknown>, allowedGlobals, parentObj, newPath)
//           if (!result) {
//             return invalidResponse
//           }
//         }
//       }
//     // }
  
//     const a = parentObj[fn_keys]
//     console.log("****", "a is ", a)
//     // const rajatkeys : string[] = parentObj[fn_keys] as string[]
//     // rajatkeys.push("newnewrandomrandom")
//     // parentObj = {...parentObj, [fn_keys]: [...(parentObj[fn_keys] as string[]) , ...fnKeys]}
//     // parentObj[fn_keys] = [...(parentObj[fn_keys] as string[]) , ...fnKeys]
//     console.log("****", "parent object fn keys are ", parentObj[fn_keys])
//     console.log("****", " and parent object is ", JSON.stringify(parentObj), parentObj)
  
//     console.log("****", "going to return final object ", finalResult, "are objects equal ", finalResult.parsed == userObj, userObj == parentObj)
//     return finalResult;
//   } catch (error) {
//     console.log("****", "caught error ", error)
//     return invalidResponse
//   }
// }

// export const validateObjectWithFunctions123 = (config: ValidationConfig, value: unknown, props: Record<string, unknown>, propertyPath: string) : ValidationResponse => {
//   const invalidResponse = {
//     isValid: true,
//     parsed: {},
//     messages: [
//       {
//         name: "TypeError",
//         message: `${WIDGET_TYPE_VALIDATION_ERROR} ${getExpectedType(config)}`,
//       },
//     ],
//   };

//   const validateObject = VALIDATORS[ValidationTypes.OBJECT]
//   const result = validateObject(config, value, props, propertyPath)
//   if (!result.isValid) {
//     return invalidResponse
//   }
// }

const sandboxedFn = (fn: any) => {
  const sandboxFnString = `(...sandbox_args) => {
    const document = undefined;
    const fetch = undefined
    const a = (${fn.toString()})(...sandbox_args)
    return a
}
    `
  const newFn = new Function("return " + sandboxFnString)
  return newFn()
}
export const isValidFunction = (fn : any, whitelistedGlobals: string[]) : ValidationResponse=> {
  // const myFunc = (new Function("return " + fn.toString()))()

  const fnString = fn.toString().replace(/\n|\r|\t/g, ""); 
  console.log("*********", "fn string is ", fnString)

  // let globals : Record<string, unknown>[] = []
  // try {
  //   console.log("*********", "fn string is ", fnString)
  //   globals = detect(fnString) as Record<string, unknown>[]  
  // } catch(error) {
  //   const messages = [
  //     {
  //       name: "TypeError",
  //       message: "Invalid function format, use () => {} format",
  //     }
  //   ]
  //   return { isValid: false, parsed: "", messages: messages} ;
  // }

  const messages : Error[] = []
  // console.log("*********", "detected globals ", globals)

  // const blacklistedGlobals = globals.filter((global) => {
  //   const isBlacklisted = !whitelistedGlobals.includes(global.name as string)
  //   if (isBlacklisted) {
  //     messages.push(new Error(`${global.name} is not allowed in functions`))
  //   }
  //   return isBlacklisted
  // })

  // if (blacklistedGlobals.length > 0) {
  //   return { isValid: false, parsed: "", messages: messages} ;
  // } else {
    const newFn = sandboxedFn(fn)
    console.log("returning function ", newFn.toString())
    return { isValid: true, parsed: fnString, messages: messages };
  // }
}

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

export const decompressIdenticalEvalPaths = (
  dataTree: any,
  identicalEvalPathsPatches: Record<string, string>,
) =>
  produce(dataTree, (draft: any) =>
    Object.entries(identicalEvalPathsPatches || {}).forEach(([key, value]) => {
      const referencePathValue = get(dataTree, value);
      set(draft, key, referencePathValue);
    }),
  );

export const generateOptimisedUpdatesAndSetPrevState = (
  dataTree: any,
  dataTreeEvaluator: any,
) => {
  const identicalEvalPathsPatches =
    dataTreeEvaluator?.getEvalPathsIdenticalToState();

  const updates = generateOptimisedUpdates(
    dataTreeEvaluator?.getPrevState(),
    dataTree,
    identicalEvalPathsPatches,
  );

  dataTreeEvaluator?.setPrevState(dataTree);
  return updates;
};
