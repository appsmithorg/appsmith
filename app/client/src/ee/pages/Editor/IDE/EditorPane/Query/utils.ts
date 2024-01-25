export * from "ce/pages/Editor/IDE/EditorPane/Query/utils";

import { getQueryEntityItemUrl as CE_getQueryEntityItemUrl } from "ce/pages/Editor/IDE/EditorPane/Query/utils";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { moduleInstanceEditorURL } from "@appsmith/RouteBuilder";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";

export const getQueryEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  if (item.isModuleInstance) {
    return moduleInstanceEditorURL({
      pageId,
      moduleType: MODULE_TYPE.QUERY,
      moduleInstanceId: item.key,
    });
  }
  return CE_getQueryEntityItemUrl(item, pageId);
};
