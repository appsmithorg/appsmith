import type { DataTree } from "entities/DataTree/dataTreeFactory";
import produce from "immer";
import { cloneDeep, get, set } from "lodash";
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
  const { evalProps, identicalEvalPathsPatches } = option;

  const dataTreeToReturn = cloneDeep(dataTree);

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

  const evalPropsCopy = cloneDeep(evalProps);
  const newState = produce(dataTreeToReturn, (draft) => {
    // decompressIdenticalEvalPaths

    for (const [entityName, entityEvalProps] of Object.entries(evalPropsCopy)) {
      if (!entityEvalProps.__evaluation__) continue;

      set(draft[entityName], "__evaluation__", entityEvalProps.__evaluation__);
    }
    Object.entries(identicalEvalPathsPatches || {}).forEach(
      ([evalPath, statePath]) => {
        const referencePathValue = get(draft, statePath);
        set(draft, evalPath, referencePathValue);
      },
    );
  });
  return newState;
}
