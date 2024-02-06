import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { FocusEntityInfo } from "navigation/FocusEntity";
import {
  apiEditorIdURL,
  queryAddURL,
  queryEditorIdURL,
  saasEditorApiIdURL,
} from "@appsmith/RouteBuilder";

export const getQueryEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  const config = getActionConfig(item.type);
  if (!config) {
    throw Error(`Cannot find url of plugin type ${item.type}`);
  }
  return config.getURL(pageId, item.key, item.type);
};

export const getQueryAddUrl = (item: FocusEntityInfo): string => {
  if (item.params.apiId) {
    if (item.params.pluginPackageName) {
      return saasEditorApiIdURL({
        pluginPackageName: item.params.pluginPackageName,
        apiId: item.params.apiId,
        add: true,
      });
    } else {
      return apiEditorIdURL({
        apiId: item.params.apiId,
        add: true,
      });
    }
  } else if (item.params.queryId) {
    return queryEditorIdURL({
      queryId: item.params.queryId,
      add: true,
    });
  }
  return queryAddURL({});
};
