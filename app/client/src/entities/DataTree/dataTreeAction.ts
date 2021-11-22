import { DependencyMap, DynamicPath } from "utils/DynamicBindingUtils";
import { DataTreeAction, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import {
  getBindingPathsOfAction,
  getDataTreeActionConfigPath,
} from "entities/Action/actionProperties";
import { Property } from "api/ActionAPI";

export const generateDataTreeAction = (
  action: ActionData,
  editorConfig: any[],
  dependencyConfig: DependencyMap = {},
): DataTreeAction => {
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

  // update datasource url for embedded datasource action
  if ("datasourceConfiguration" in action.config.datasource) {
    const path =
      "path" in action.config.actionConfiguration
        ? action.config.actionConfiguration.path
        : "";

    const query = action.config.actionConfiguration.queryParameters
      .filter((p: Property) => p.key)
      .map(
        (p: Property, i: number) => `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
      )
      .join("");

    datasourceUrl =
      action.config.datasource.datasourceConfiguration.url + path + query;
  }

  const dependencyMap: DependencyMap = {};
  Object.entries(dependencyConfig).forEach(([dependent, dependencies]) => {
    dependencyMap[getDataTreeActionConfigPath(dependent)] = dependencies.map(
      getDataTreeActionConfigPath,
    );
  });
  return {
    run: {},
    clear: {},
    actionId: action.config.id,
    name: action.config.name,
    pluginType: action.config.pluginType,
    config: action.config.actionConfiguration,
    dynamicBindingPathList,
    data: action.data ? action.data.body : {},
    responseMeta: {
      statusCode: action.data?.statusCode,
      isExecutionSuccess: action.data?.isExecutionSuccess || false,
      headers: action.data?.headers,
    },
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    isLoading: action.isLoading,
    bindingPaths: getBindingPathsOfAction(action.config, editorConfig),
    dependencyMap,
    logBlackList: {},
    datasourceUrl,
  };
};
