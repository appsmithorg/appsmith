import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { get, isObject, set } from "lodash";
import { klona } from "klona/json";
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
    newDataTree[entityName] = isObject(entity)
      ? Object.assign({}, entity)
      : entity;
  }
  const dataTreeToReturn = sanitizeDataTree ? klona(newDataTree) : newDataTree;

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

  for (const [entityName, entityEvalProps] of Object.entries(evalProps)) {
    if (!entityEvalProps.__evaluation__) continue;
    set(
      dataTreeToReturn[entityName],
      "__evaluation__",
      klona({ errors: entityEvalProps.__evaluation__.errors }),
    );
  }

  return dataTreeToReturn;
}
