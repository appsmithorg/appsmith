import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";

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
