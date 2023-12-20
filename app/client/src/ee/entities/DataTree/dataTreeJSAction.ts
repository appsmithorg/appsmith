export * from "ce/entities/DataTree/dataTreeJSAction";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { JSActionEntity, JSActionEntityConfig } from "./types";
import { generateDataTreeJSAction as CE_generateDataTreeJSAction } from "ce/entities/DataTree/dataTreeJSAction";

export const generateDataTreeJSAction = (
  js: JSCollectionData,
): {
  unEvalEntity: JSActionEntity;
  configEntity: JSActionEntityConfig;
} => {
  const { configEntity, unEvalEntity } = CE_generateDataTreeJSAction(js);

  if (js.config.moduleId || js.config.moduleInstanceId) {
    configEntity["moduleInstanceId"] = js.config.moduleInstanceId;
    configEntity["moduleId"] = js.config.moduleId;
  }

  return {
    configEntity: configEntity,
    unEvalEntity: unEvalEntity,
  };
};
