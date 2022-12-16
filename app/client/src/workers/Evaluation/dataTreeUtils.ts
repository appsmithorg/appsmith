import {
  DataTree,
  DataTreeEntity,
  UnEvalTree,
  UnEvalTreeEntityObject,
} from "entities/DataTree/dataTreeFactory";
import { set } from "lodash";
import { EvalProps } from "workers/common/DataTreeEvaluator";
import { removeFunctions } from "./evaluationUtils";

/**
 * This method accept an entity object as input and if it has __config__ property than it moves the __config__ to object's prototype
 */
export function createNewEntity(entity: UnEvalTreeEntityObject) {
  if (!entity || !entity.hasOwnProperty("__config__")) return entity;
  const { __config__, ...rest } = entity;
  const newObj = Object.create(__config__);
  Object.assign(newObj, rest) as DataTreeEntity;
  return newObj;
}
/**
 * This method takes unevaltree received from mainThread as input and return a new unEvalTree with each entity config moved to entity object's prototype.
 * Moving configs to prototype skips it from diffing, cloning and getAllPaths calculation.
 * Refer: https://github.com/appsmithorg/appsmith/pull/18361 to know more
 */
export function createUnEvalTreeForEval(unevalTree: UnEvalTree) {
  const newUnEvalTree: DataTree = {};

  for (const entityName of Object.keys(unevalTree)) {
    const entity = unevalTree[entityName];
    newUnEvalTree[entityName] = createNewEntity(
      entity as UnEvalTreeEntityObject,
    );
  }

  return newUnEvalTree;
}

/**
 * This method loops through each entity object of dataTree and sets the entity config from prototype as object properties.
 * This is done to send back dataTree in the format expected by mainThread.
 */
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
    const entityConfig = Object.getPrototypeOf(dataTree[entityName]) || {};
    const entity = dataTree[entityName];
    newDataTree[entityName] = { ...entityConfig, ...entity };
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
