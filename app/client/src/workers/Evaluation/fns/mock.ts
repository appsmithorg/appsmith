import { ENTITY_TYPE } from "design-system-old";
import { PluginType } from "entities/Action";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { createEvaluationContext } from "workers/Evaluation/evaluate";

const dataTree: DataTree = {
  action1: {
    actionId: "123",
    pluginId: "",
    data: {},
    config: {},
    datasourceUrl: "",
    pluginType: PluginType.API,
    dynamicBindingPathList: [],
    name: "action1",
    bindingPaths: {},
    reactivePaths: {},
    isLoading: false,
    run: {},
    clear: {},
    responseMeta: { isExecutionSuccess: false },
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    dependencyMap: {},
    logBlackList: {},
  },
};

export const evalContext = createEvaluationContext({
  dataTree,
  resolvedFunctions: {},
  isTriggerBased: true,
  context: {},
});
