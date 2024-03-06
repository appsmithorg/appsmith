import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import type { JSModuleInstanceEntityConfig } from "@appsmith/entities/DataTree/types";
import { getJSActionForEvalContext } from "workers/Evaluation/getJSActionForEvalContext";
import { dataTreeEvaluator } from "workers/Evaluation/handlers/evalTree";

type ModuleInstanceEntity = any;

const getModuleInstanceForEvalContextMap: Record<
  string,
  | ((entityName: string, entity: ModuleInstanceEntity) => ModuleInstanceEntity)
  | null
> = {
  [MODULE_TYPE.QUERY]: null,
  [MODULE_TYPE.JS]: (entityName, entity) => {
    if (!dataTreeEvaluator) return entity;
    const { configTree, evalTree } = dataTreeEvaluator;
    const configTreeEntity = configTree[
      entityName
    ] as JSModuleInstanceEntityConfig;
    const { publicEntityName } = configTreeEntity;
    /*
     * For 1st eval, evalTree[publicEntityName] will be undefined and for subsequent evals, it will be defined hence we pass entity for the 1st eval and publicEvalJSObject for subsequent evals.
     */
    const publicEvalJSObject = evalTree[publicEntityName] || entity;
    return getJSActionForEvalContext(publicEntityName, publicEvalJSObject);
  },
  [MODULE_TYPE.UI]: null,
};

export function getModuleInstanceForEvalContext(
  entityName: string,
  entity: ModuleInstanceEntity,
) {
  const getModuleInstanceForEvalContextMethod =
    getModuleInstanceForEvalContextMap[entity.type];
  if (!getModuleInstanceForEvalContextMethod) return entity;

  return getModuleInstanceForEvalContextMethod(entityName, entity);
}
