import type { EntityItem } from "ee/entities/IDE/constants";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  apiEditorIdURL,
  queryAddURL,
  queryEditorIdURL,
  queryListURL,
  saasEditorApiIdURL,
} from "ee/RouteBuilder";
import type { ActionParentEntityTypeInterface } from "ee/entities/Engine/actionHelpers";
import { ActionEntityContextMenuItemsEnum } from "pages/Editor/Explorer/Files/FilesContextProvider";

export const getQueryEntityItemUrl = (
  item: EntityItem,
  basePageId: string,
): string => {
  const config = getActionConfig(item.type);

  if (!config) {
    throw Error(`Cannot find url of plugin type ${item.type}`);
  }

  return config.getURL(basePageId, item.key, item.type);
};

export const getQueryUrl = (
  item: FocusEntityInfo,
  add: boolean = true,
): string => {
  if (item.params.baseApiId) {
    if (item.params.pluginPackageName) {
      return saasEditorApiIdURL({
        pluginPackageName: item.params.pluginPackageName,
        baseApiId: item.params.baseApiId,
        add,
      });
    } else {
      return apiEditorIdURL({
        baseApiId: item.params.baseApiId,
        add,
      });
    }
  } else if (item.params.baseQueryId) {
    if (item.params.baseQueryId === "add") {
      return queryListURL({ basePageId: item.params.basePageId });
    }

    return queryEditorIdURL({
      baseQueryId: item.params.baseQueryId,
      add,
    });
  }

  return add
    ? queryAddURL({ basePageId: item.params.basePageId })
    : queryListURL({ basePageId: item.params.basePageId });
};

export const getMenuItemsForActionEntityByParentType = (
  parentEntityType: ActionParentEntityTypeInterface,
) => {
  const defaultMenuItems = [
    ActionEntityContextMenuItemsEnum.RENAME,
    ActionEntityContextMenuItemsEnum.DELETE,
    ActionEntityContextMenuItemsEnum.SHOW_BINDING,
    ActionEntityContextMenuItemsEnum.COPY,
    ActionEntityContextMenuItemsEnum.MOVE,
    ActionEntityContextMenuItemsEnum.CONVERT_QUERY_MODULE_INSTANCE,
  ];

  switch (parentEntityType) {
    case "PAGE":
      return defaultMenuItems;
    default:
      return defaultMenuItems;
  }
};
