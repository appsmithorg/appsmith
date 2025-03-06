import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import { getActionConfig } from "pages/Editor/Explorer/Actions/helpers";

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
