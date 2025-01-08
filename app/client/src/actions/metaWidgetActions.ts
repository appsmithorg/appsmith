import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  DeleteMetaWidgetsPayload,
  ModifyMetaWidgetPayload,
  UpdateMetaWidgetPropertyPayload,
} from "reducers/entityReducers/metaWidgetsReducer.types";

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

export const updateMetaWidgetProperty = (
  payload: UpdateMetaWidgetPropertyPayload,
) => ({
  type: ReduxActionTypes.UPDATE_META_WIDGET_PROPERTY,
  payload,
});
