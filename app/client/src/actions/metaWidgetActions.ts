import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ModifyMetaWidgetPayload } from "reducers/entityReducers/metaCanvasWidgetsReducer";

export const modifyMetaWidgets = (payload: ModifyMetaWidgetPayload) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGET,
  payload,
});
