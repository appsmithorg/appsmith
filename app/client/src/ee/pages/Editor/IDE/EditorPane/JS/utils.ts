export * from "ce/pages/Editor/IDE/EditorPane/JS/utils";

import { getJSEntityItemUrl as CE_getJSEntityItemUrl } from "ce/pages/Editor/IDE/EditorPane/JS/utils";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const getJSEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  if (item.isModuleInstance) {
    return moduleInstanceEditorURL({
      pageId,
      moduleType: MODULE_TYPE.JS,
      moduleInstanceId: item.key,
    });
  }
  return CE_getJSEntityItemUrl(item, pageId);
};
