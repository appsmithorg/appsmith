import {
  apiEditorIdURL,
  queryAddURL,
  queryEditorIdURL,
  queryListURL,
  saasEditorApiIdURL,
} from "ee/RouteBuilder";
import type { FocusEntityInfo } from "navigation/FocusEntity";

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
