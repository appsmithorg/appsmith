import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { ModifyMetaWidgetPayload } from "reducers/entityReducers/metaCanvasWidgetsReducer";
import { FlattenedWidgetProps } from "widgets/constants";

export const addMetaWidget = (
  payload: Record<string, FlattenedWidgetProps>,
) => ({
  type: ReduxActionTypes.ADD_META_WIDGET,
  payload,
});

export const updateMetaWidget = (
  payload: Record<string, FlattenedWidgetProps>,
) => ({
  type: ReduxActionTypes.UPDATE_META_WIDGET,
  payload,
});

export const deleteMetaWidget = (payload: string | string[]) => ({
  type: ReduxActionTypes.DELETE_META_WIDGET,
  payload,
});

export const modifyMetaWidgets = (payload: ModifyMetaWidgetPayload) => ({
  type: ReduxActionTypes.MODIFY_META_WIDGET,
  payload,
});
