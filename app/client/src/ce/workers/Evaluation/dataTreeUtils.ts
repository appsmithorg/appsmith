/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { isObject, set } from "lodash";
import { klona } from "klona/json";
import type { EvalProps } from "workers/common/DataTreeEvaluator";

/**
 * This method loops through each entity object of dataTree and sets the entity config from prototype as object properties.
 * This is done to send back dataTree in the format expected by mainThread.
 */

const klona16 = (data: any) => {
  return klona(data);
};
const klona17 = (data: any) => {
  return klona(data);
};

export function makeEntityConfigsAsObjProperties(
  dataTree: DataTree,
  option = {} as {
    sanitizeDataTree?: boolean;
    evalProps?: EvalProps;
  },
): DataTree {
  const { evalProps, sanitizeDataTree = true } = option;
  const newDataTree: DataTree = {};

  for (const entityName of Object.keys(dataTree)) {
    const entity = dataTree[entityName];

    newDataTree[entityName] = isObject(entity)
      ? Object.assign({}, entity)
      : entity;
  }

  const dataTreeToReturn = sanitizeDataTree
    ? klona16(newDataTree)
    : newDataTree;

  if (!evalProps) return dataTreeToReturn;

  for (const [entityName, entityEvalProps] of Object.entries(evalProps)) {
    if (!entityEvalProps.__evaluation__) continue;

    set(
      dataTreeToReturn[entityName],
      "__evaluation__",
      klona17({ errors: entityEvalProps.__evaluation__.errors }),
    );
  }

  return dataTreeToReturn;
}
