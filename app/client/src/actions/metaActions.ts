import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { BatchAction, batchAction } from "actions/batchActions";
import { Diff } from "deep-diff";
import { DataTree } from "entities/DataTree/dataTreeFactory";

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
    postEvalActions: [{ type: ReduxActionTypes.RESET_WIDGET_META_EVALUATED }],
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

export const updateMetaState = (
  updates: Diff<any, any>[],
  updatedDataTree: DataTree,
) => {
  return {
    type: ReduxActionTypes.UPDATE_META_STATE,
    payload: {
      updates,
      updatedDataTree,
    },
  };
};
