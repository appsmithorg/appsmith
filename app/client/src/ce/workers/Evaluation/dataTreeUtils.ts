import { DataTree } from "entities/DataTree/dataTreeFactory";
import { set } from "lodash";
import { EvalProps } from "workers/common/DataTreeEvaluator";
import { removeFunctions } from "@appsmith/workers/Evaluation/evaluationUtils";

/**
 * This method loops through each entity object of dataTree and sets the entity config from prototype as object properties.
 * This is done to send back dataTree in the format expected by mainThread.
 */
export function makeEntityConfigsAsObjProperties(
  dataTree: any,
  option = {} as {
    sanitizeDataTree?: boolean;
    evalProps?: EvalProps;
  },
): DataTree {
  const { evalProps, sanitizeDataTree = true } = option;
  const newDataTree: DataTree = {};
  for (const entityName of Object.keys(dataTree)) {
    // const entityConfig = Object.getPrototypeOf(dataTree[entityName]) || {};
    const entity = dataTree[entityName];
    newDataTree[entityName] = Object.assign({}, entity);
  }
  const dataTreeToReturn = sanitizeDataTree
    ? JSON.parse(JSON.stringify(newDataTree))
    : newDataTree;

  if (!evalProps) return dataTreeToReturn;

  const sanitizedEvalProps = removeFunctions(evalProps) as EvalProps;
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
