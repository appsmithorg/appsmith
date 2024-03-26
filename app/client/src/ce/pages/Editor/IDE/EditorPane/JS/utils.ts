import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { jsCollectionIdURL } from "@appsmith/RouteBuilder";

export const getJSEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  return jsCollectionIdURL({
    collectionId: item.key,
    pageId,
  });
};
