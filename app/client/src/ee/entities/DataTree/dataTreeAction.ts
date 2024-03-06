export * from "ce/entities/DataTree/dataTreeAction";
import { generateDataTreeAction as CE_generateDataTreeAction } from "ce/entities/DataTree/dataTreeAction";
import type {
  ActionEntity,
  ActionEntityConfig,
} from "@appsmith/entities/DataTree/types";
import type { ActionData } from "@appsmith/reducers/entityReducers/actionsReducer";
import type { DependencyMap } from "utils/DynamicBindingUtils";

export const generateDataTreeAction = (
  action: ActionData,
  editorConfig: any[],
  dependencyConfig: DependencyMap = {},
): {
  unEvalEntity: ActionEntity;
  configEntity: ActionEntityConfig;
} => {
  const { configEntity, unEvalEntity } = CE_generateDataTreeAction(
    action,
    editorConfig,
    dependencyConfig,
  );
  if (action.config.moduleId || action.config.moduleInstanceId) {
    configEntity["moduleInstanceId"] = action.config.moduleInstanceId;
    configEntity["moduleId"] = action.config.moduleId;
  }

  return {
    configEntity: configEntity,
    unEvalEntity: unEvalEntity,
  };
};
