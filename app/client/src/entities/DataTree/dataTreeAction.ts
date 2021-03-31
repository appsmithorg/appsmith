import { DynamicPath } from "utils/DynamicBindingUtils";
import { DataTreeAction, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import { ActionData } from "reducers/entityReducers/actionsReducer";
import { getBindingPathsOfAction } from "entities/Action/actionProperties";

export const generateDataTreeAction = (
  action: ActionData,
  editorConfig: any[],
): DataTreeAction => {
  let dynamicBindingPathList: DynamicPath[] = [];
  // update paths
  if (
    action.config.dynamicBindingPathList &&
    action.config.dynamicBindingPathList.length
  ) {
    dynamicBindingPathList = action.config.dynamicBindingPathList.map((d) => ({
      ...d,
      key: `config.${d.key}`,
    }));
  }
  return {
    run: {},
    actionId: action.config.id,
    name: action.config.name,
    pluginType: action.config.pluginType,
    config: action.config.actionConfiguration,
    dynamicBindingPathList,
    data: action.data ? action.data.body : {},
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    isLoading: action.isLoading,
    bindingPaths: getBindingPathsOfAction(action.config, editorConfig),
  };
};
