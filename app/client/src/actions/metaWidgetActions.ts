import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  DeleteMetaWidgetsPayload,
  ModifyMetaWidgetPayload,
} from "reducers/entityReducers/metaCanvasWidgetsReducer";

export const modifyMetaWidgets = (payload: ModifyMetaWidgetPayload) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGETS,
  payload,
});

export const deleteMetaWidgets = (
  payload: DeleteMetaWidgetsPayload,
): ReduxAction<DeleteMetaWidgetsPayload> => {
  return {
    type: ReduxActionTypes.DELETE_META_WIDGETS,
    payload,
  };
};
