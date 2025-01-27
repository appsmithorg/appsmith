import type { EntityItem } from "ee/entities/IDE/constants";
import { jsCollectionIdURL } from "ee/RouteBuilder";

export const getJSEntityItemUrl = (
  item: EntityItem,
  basePageId: string,
): string => {
  return jsCollectionIdURL({
    baseCollectionId: item.key,
    basePageId,
  });
};
