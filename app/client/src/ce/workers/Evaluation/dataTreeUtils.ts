import type { DataTree } from "entities/DataTree/dataTreeFactory";

import { get, set, unset } from "lodash";
import rfdc from "rfdc";
import type { EvalProps } from "workers/common/DataTreeEvaluator";
//rfdc is much more performant in perfomring deepclone than klona
// Setting proto to true copies prototype properties as well as own properties into the new object.
// This supposedly gives a 2% increase in perfomance https://github.com/davidmarkclements/rfdc/blob/master/readme.md#requirerfdcopts---proto-false-circles-false---cloneobj--obj2

const deepCloneRfdc = rfdc({ proto: true });

/**
 * This method loops through each entity object of dataTree and sets the entity config from prototype as object properties.
 * This is done to send back dataTree in the format expected by mainThread.
 */
export function makeEntityConfigsAsObjProperties(
  dataTree: DataTree,
  option = {} as {
    sanitizeDataTree?: boolean;
    evalProps?: EvalProps;
    identicalEvalPathsPatches?: Record<string, string>;
  },
): DataTree {
  const {
    evalProps,
    identicalEvalPathsPatches,
    sanitizeDataTree = true,
  } = option;
  const newDataTree: DataTree = {};
  for (const entityName of Object.keys(dataTree)) {
    const entity = dataTree[entityName];
    newDataTree[entityName] = Object.assign({}, entity);
  }
  const dataTreeToReturn = sanitizeDataTree
    ? deepCloneRfdc(newDataTree)
    : newDataTree;

  if (!evalProps) return dataTreeToReturn;

  //clean up deletes widget states
  Object.entries(identicalEvalPathsPatches || {}).forEach(
    ([evalPath, statePath]) => {
      const [entity] = statePath.split(".");
      if (!dataTreeToReturn[entity]) {
        delete identicalEvalPathsPatches?.[evalPath];
      }
    },
  );

  // decompressIdenticalEvalPaths
  Object.entries(identicalEvalPathsPatches || {}).forEach(
    ([evalPath, statePath]) => {
      const referencePathValue = get(dataTreeToReturn, statePath);
      set(evalProps, evalPath, referencePathValue);
    },
  );

  const alreadySanitisedDataSet = {} as EvalProps;
  Object.keys(identicalEvalPathsPatches || {}).forEach((evalPath) => {
    const val = get(evalProps, evalPath);
    //serialised already
    alreadySanitisedDataSet[evalPath] = val;
    //we are seperating it from evalProps because we don't want to serialise this identical data unecessarily again
    unset(evalProps, evalPath);
  });

  const sanitizedEvalProps = deepCloneRfdc(evalProps) as EvalProps;
  Object.entries(alreadySanitisedDataSet).forEach(([path, val]) => {
    // add it to sanitised Eval props
    set(sanitizedEvalProps, path, val);
    //restore it to evalProps
    set(evalProps, path, val);
  });
  for (const [entityName, entityEvalProps] of Object.entries(
    sanitizedEvalProps,
  )) {
    if (!entityEvalProps.__evaluation__) continue;
    set(
      dataTreeToReturn[entityName],
      "__evaluation__",
      entityEvalProps.__evaluation__,
    );
  }

  return dataTreeToReturn;
}
