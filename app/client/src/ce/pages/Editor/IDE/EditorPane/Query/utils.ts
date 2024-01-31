import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";
import type { FocusEntityInfo } from "navigation/FocusEntity";

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

export enum QueryType {
  API = "API",
  SAAS = "SAAS",
  QUERY = "QUERY",
}

export const getQueryType = (item: FocusEntityInfo): QueryType | undefined => {
  if (item.params.apiId) {
    if (item.params.pluginPackageName) {
      return QueryType.SAAS;
    } else {
      return QueryType.API;
    }
  } else if (item.params.queryId) {
    return QueryType.QUERY;
  }
};
