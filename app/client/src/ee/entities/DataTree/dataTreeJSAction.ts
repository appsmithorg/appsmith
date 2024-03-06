export * from "ce/entities/DataTree/dataTreeJSAction";
import type { JSCollectionData } from "@appsmith/reducers/entityReducers/jsActionsReducer";
import type { JSActionEntity, JSActionEntityConfig } from "./types";
import { generateDataTreeJSAction as CE_generateDataTreeJSAction } from "ce/entities/DataTree/dataTreeJSAction";
import { klona } from "klona";

export const generateDataTreeJSAction = (
  js: JSCollectionData,
): {
  unEvalEntity: JSActionEntity;
  configEntity: JSActionEntityConfig;
} => {
  const isPublic = js.config.isPublic;
  let newJS = js;
  if (isPublic && !js.config.body) {
    newJS = klona(js);
    const jsBody = isPublic && !newJS.config.body ? "" : newJS.config.body;
    const variables =
      isPublic && !newJS.config.variables ? [] : newJS.config.variables;

    newJS.config["body"] = jsBody;
    newJS.config["variables"] = variables;
  }

  const { configEntity, unEvalEntity } = CE_generateDataTreeJSAction(newJS);

  if (js.config.moduleId || js.config.moduleInstanceId) {
    configEntity["moduleInstanceId"] = js.config.moduleInstanceId;
    configEntity["moduleId"] = js.config.moduleId;
  }

  return {
    configEntity: configEntity,
    unEvalEntity: unEvalEntity,
  };
};
