/* eslint-disable no-console */
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { get, set, unset } from "lodash";
import type { EvalProps } from "workers/common/DataTreeEvaluator";

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
  let dataTreeToReturn: any;
  try {
    dataTreeToReturn = sanitizeDataTree
      ? structuredClone(newDataTree)
      : newDataTree;

    if (!evalProps) return dataTreeToReturn;
  } catch (e) {
    console.log("function is presenet ", newDataTree);
    throw new Error("function embedded ", e as any);
  }
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
      set(evalProps as any, evalPath, referencePathValue);
    },
  );

  const alreadySanitisedDataSet = {} as any;
  Object.keys(identicalEvalPathsPatches || {}).forEach((evalPath) => {
    const val = get(evalProps, evalPath);
    //serialised already
    alreadySanitisedDataSet[evalPath] = val;
    //we are seperating it from evalProps because we don't want to serialise this identical data unecessarily again
    unset(evalProps, evalPath);
  });
  let sanitizedEvalProps: any;
  try {
    sanitizedEvalProps = structuredClone(evalProps) as EvalProps;
  } catch (e) {
    console.log("function is presenet in evalProps ", evalProps);
    throw new Error("function embedded ", e as any);
  }

  Object.entries(alreadySanitisedDataSet).forEach(([path, val]) => {
    // add it to sanitised Eval props
    set(sanitizedEvalProps, path, val);
    //restore it to evalProps
    set(evalProps as any, path, val);
  });
  for (const [entityName, entityEvalProps] of Object.entries(
    sanitizedEvalProps,
  ) as any) {
    if (!entityEvalProps.__evaluation__) continue;
    set(
      dataTreeToReturn[entityName],
      "__evaluation__",
      entityEvalProps.__evaluation__,
    );
  }

  return dataTreeToReturn;
}
