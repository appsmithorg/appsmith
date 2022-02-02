import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { BatchAction, batchAction } from "actions/batchActions";
import { MetaState } from "../reducers/entityReducers/metaReducer";
import set from "lodash/set";
import { Diff } from "deep-diff";

export interface UpdateWidgetMetaPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: any;
}
export const updateWidgetMetaProperty = (
  widgetId: string,
  propertyName: string,
  propertyValue: any,
): BatchAction<UpdateWidgetMetaPropertyPayload> => {
  return batchAction({
    type: ReduxActionTypes.SET_META_PROP,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
    },
  });
};

export const resetWidgetMetaProperty = (
  widgetId: string,
): BatchAction<{ widgetId: string }> => {
  return batchAction({
    type: ReduxActionTypes.RESET_WIDGET_META,
    payload: {
      widgetId,
    },
  });
};

export const resetChildrenMetaProperty = (
  widgetId: string,
): ReduxAction<{ widgetId: string }> => {
  return {
    type: ReduxActionTypes.RESET_CHILDREN_WIDGET_META,
    payload: {
      widgetId,
    },
  };
};

export const updateMetaState = (updates: Diff<any, any>[]) => {
  const updatedWidgetMetaState: MetaState = {};
  if (updates.length) {
    updates.forEach((update) => {
      // if meta field is updated in old and new dataTree when update metaReducer
      if (update.kind === "E" && update.path && update.path?.includes("meta")) {
        set(updatedWidgetMetaState, update.path, update.rhs);
      }
    });
  }
  return {
    type: ReduxActionTypes.UPDATE_META_STATE,
    payload: {
      updatedWidgetMetaState,
    },
  };
};
