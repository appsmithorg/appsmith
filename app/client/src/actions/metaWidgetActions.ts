import type { ReduxAction } from "./ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  DeleteMetaWidgetsPayload,
  ModifyMetaWidgetPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer";

export const modifyMetaWidgets = (payload: ModifyMetaWidgetPayload) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGETS,
  payload,
});

export const modifyMetaWidgetsWithoutEval = (
  payload: ModifyMetaWidgetPayload,
) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGETS_WITHOUT_EVAL,
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

export const updateMetaWidgetProperty = (
  payload: UpdateMetaWidgetPropertyPayload,
) => ({
  type: ReduxActionTypes.UPDATE_META_WIDGET_PROPERTY_INIT,
  payload,
});
