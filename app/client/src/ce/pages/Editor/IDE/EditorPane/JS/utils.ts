import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  jsCollectionAddURL,
  jsCollectionIdURL,
  jsCollectionListURL,
} from "@appsmith/RouteBuilder";
import { FocusEntity, type FocusEntityInfo } from "navigation/FocusEntity";

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
  if (item.entity === FocusEntity.JS_OBJECT) {
    return jsCollectionIdURL({
      collectionId: item.id,
      add,
    });
  } else if (item.entity === FocusEntity.JS_OBJECT_ADD) {
    return jsCollectionListURL({ pageId: item.params.pageId });
  }
  return add
    ? jsCollectionAddURL({ pageId: item.params.pageId })
    : jsCollectionListURL({ pageId: item.params.pageId });
};
