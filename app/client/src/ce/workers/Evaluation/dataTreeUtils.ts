import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { get, set } from "lodash";
import type { EvalProps } from "workers/common/DataTreeEvaluator";
import { removeFunctionsAndSerialzeBigInt } from "@appsmith/workers/Evaluation/evaluationUtils";

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
    ? removeFunctionsAndSerialzeBigInt(newDataTree)
    : newDataTree;

  if (!evalProps) return dataTreeToReturn;

  const sanitizedEvalProps = removeFunctionsAndSerialzeBigInt(
    evalProps,
  ) as EvalProps;

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
  // we are seperately adding identical identicalEvalPathsPatches back to the state and evalProps, this is because we don't want to
  //unnecessarily perform the santise code on this segment since we know these are duplicates
  Object.entries(identicalEvalPathsPatches || {}).forEach(
    ([evalPath, statePath]) => {
      const referencePathValue = get(dataTreeToReturn, statePath);
      set(dataTreeToReturn, evalPath, referencePathValue);
      set(evalProps, evalPath, referencePathValue);
    },
  );

  return dataTreeToReturn;
}
