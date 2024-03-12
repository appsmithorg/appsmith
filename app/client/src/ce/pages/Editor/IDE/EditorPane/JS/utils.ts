import type { EntityItem } from "@appsmith/entities/IDE/constants";
import { jsCollectionIdURL, jsCollectionListURL } from "@appsmith/RouteBuilder";
import type { FocusEntityInfo } from "navigation/FocusEntity";

export const getJSEntityItemUrl = (
  item: EntityItem,
  pageId: string,
): string => {
  return jsCollectionIdURL({
    collectionId: item.key,
    pageId,
  });
};

export const getJSUrl = (
  item: FocusEntityInfo,
  add: boolean = true,
): string => {
  if (item.params.collectionId) {
    if (item.params.collectionId === "add") {
      return jsCollectionListURL({ pageId: item.params.pageId });
    }
    return jsCollectionIdURL({
      collectionId: item.params.collectionId,
      add,
    });
  }
  return jsCollectionListURL({ pageId: item.params.pageId });
};
