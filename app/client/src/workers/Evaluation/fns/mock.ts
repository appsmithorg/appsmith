import { ENTITY_TYPE } from "design-system-old";
import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";

const dataTree: DataTree = {
  action1: {
    actionId: "123",
    data: {},
    config: {},
    datasourceUrl: "",
    isLoading: false,
    run: {},
    clear: {},
    responseMeta: { isExecutionSuccess: false },
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
  },
};

export const evalContext = createEvaluationContext({
  dataTree,
  resolvedFunctions: {},
  isTriggerBased: true,
  context: {},
});
