import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  getBindingAndReactivePathsOfAction,
  getDataTreeActionConfigPath,
} from "entities/Action/actionProperties";
import { ActionEntityConfig, ActionEntityEvalTree } from "./types";

export const generateDataTreeAction = (
  action: ActionData,
  editorConfig: any[],
  dependencyConfig: DependencyMap = {},
): { dataTree: ActionEntityEvalTree; entityConfig: ActionEntityConfig } => {
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
    datasourceUrl = action.config.datasource.datasourceConfiguration.url;
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
  );

  return {
    dataTree: {
      run: {},
      clear: {},
      data: action.data ? action.data.body : undefined,
      isLoading: action.isLoading,
      responseMeta: {
        statusCode: action.data?.statusCode,
        isExecutionSuccess: action.data?.isExecutionSuccess || false,
        headers: action.data?.headers,
      },
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
    },
    entityConfig: {
      actionId: action.config.id,
      name: action.config.name,
      pluginId: action.config.pluginId,
      pluginType: action.config.pluginType,
      config: action.config.actionConfiguration,
      dynamicBindingPathList,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      bindingPaths,
      reactivePaths,
      dependencyMap,
      logBlackList: {},
      datasourceUrl,
    },
  };
};
