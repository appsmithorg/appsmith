import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  BulkDeleteMetaWidgetPayload,
  ModifyMetaWidgetPayload,
} from "reducers/entityReducers/metaCanvasWidgetsReducer";

export const modifyMetaWidgets = (payload: ModifyMetaWidgetPayload) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGETS,
  payload,
});

export const deleteMetaWidgets = (
  widgetIds: string[] = [],
): ReduxAction<BulkDeleteMetaWidgetPayload> => {
  return {
    type: ReduxActionTypes.BULK_DELETE_META_WIDGETS,
    payload: {
      metaWidgetIds: widgetIds,
    },
  };
};
