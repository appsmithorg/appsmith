import type { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import {
  getBindingAndReactivePathsOfAction,
  getDataTreeActionConfigPath,
} from "entities/Action/actionProperties";
import type {
  ActionEntity,
  ActionEntityConfig,
} from "ee/entities/DataTree/types";
import { EvaluationSubstitutionType } from "constants/EvaluationConstants";

export const generateDataTreeAction = (
  action: ActionData,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editorConfig: any[],
  dependencyConfig: DependencyMap = {},
): {
  unEvalEntity: ActionEntity;
  configEntity: ActionEntityConfig;
} => {
  let dynamicBindingPathList: DynamicPath[] = [];
  let datasourceUrl = "";

  // update paths
  if (
    action.config.dynamicBindingPathList &&
    action.config.dynamicBindingPathList.length
  ) {
    dynamicBindingPathList = action.config.dynamicBindingPathList.map((d) => ({
      ...d,
      key: d.key === "datasourceUrl" ? d.key : `config.${d.key}`,
    }));
  }

  if (
    action.config.datasource &&
    "datasourceConfiguration" in action.config.datasource
  ) {
    datasourceUrl = action.config.datasource.datasourceConfiguration?.url ?? "";
  }

  const dependencyMap: DependencyMap = {};

  Object.entries(dependencyConfig).forEach(([dependent, dependencies]) => {
    dependencyMap[getDataTreeActionConfigPath(dependent)] = dependencies.map(
      getDataTreeActionConfigPath,
    );
  });

  const { bindingPaths, reactivePaths } = getBindingAndReactivePathsOfAction(
    action.config,
    editorConfig,
    dynamicBindingPathList,
  );

  //this is for view mode
  if (action.config.jsonPathKeys && !action.config?.datasource) {
    dependencyMap["config.body"] = action.config.jsonPathKeys;
    const result = action.config.jsonPathKeys
      .map((item) => `{{${item}}}`)
      .join(" ");

    action.config.actionConfiguration = {
      ...action.config.actionConfiguration,
      body: result,
    };
    dynamicBindingPathList.push({
      key: "config.body",
    });
    bindingPaths["config.body"] = EvaluationSubstitutionType.TEMPLATE;
    reactivePaths["config.body"] = EvaluationSubstitutionType.TEMPLATE;
  }

  dependencyMap["run"] = dynamicBindingPathList.map(
    (path: { key: string }) => path.key,
  );

  const dynamicTriggerPathList = [{ key: "run" }, { key: "clear" }];

  return {
    unEvalEntity: {
      actionId: action.config.id,
      run: {},
      clear: {},
      // Data is always set to undefined in the unevalTree
      // Action data is updated directly to the dataTree (see updateActionData.ts)
      data: undefined,
      isLoading: action.isLoading,
      responseMeta: {
        statusCode: action.data?.statusCode,
        isExecutionSuccess: action.data?.isExecutionSuccess || false,
        headers: action.data?.headers,
      },
      config: action.config.actionConfiguration,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      datasourceUrl,
    },
    configEntity: {
      actionId: action.config.id,
      name: action.config.name,
      pluginId: action.config.pluginId,
      pluginType: action.config.pluginType,
      dynamicBindingPathList,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths,
      reactivePaths,
      dependencyMap,
      logBlackList: {},
      dynamicTriggerPathList,
      runBehaviour: action.config.runBehaviour,
    },
  };
};
