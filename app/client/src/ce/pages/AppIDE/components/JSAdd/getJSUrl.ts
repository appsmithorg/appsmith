import {
  jsCollectionAddURL,
  jsCollectionIdURL,
  jsCollectionListURL,
} from "ee/RouteBuilder";
import { FocusEntity, type FocusEntityInfo } from "navigation/FocusEntity";

export const getJSUrl = (
  item: FocusEntityInfo,
  add: boolean = true,
): string => {
  if (item.entity === FocusEntity.JS_OBJECT) {
    return jsCollectionIdURL({
      baseCollectionId: item.id || "",
      add,
    });
  } else if (item.entity === FocusEntity.JS_OBJECT_ADD) {
    return jsCollectionListURL({ basePageId: item.params.basePageId });
  }

  return add
    ? jsCollectionAddURL({ basePageId: item.params.basePageId })
    : jsCollectionListURL({ basePageId: item.params.basePageId });
};
