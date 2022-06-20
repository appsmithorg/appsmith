import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { BatchAction, batchAction } from "actions/batchActions";
import { EvalMetaUpdates } from "workers/DataTreeEvaluator/types";
import { DataTreeWidget } from "../entities/DataTree/dataTreeFactory";
import { ResetWidgetDescription } from "entities/DataTree/actionTriggers";

export interface UpdateWidgetMetaPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: unknown;
}

export const updateWidgetMetaPropAndEval = (
  widgetId: string,
  propertyName: string,
  propertyValue: unknown,
): BatchAction<UpdateWidgetMetaPropertyPayload> => {
  return batchAction({
    type: ReduxActionTypes.SET_META_PROP_AND_EVAL,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
    },
  });
};

export type ResetWidgetMetaPayload = {
  widgetId: string;
  evaluatedWidget: DataTreeWidget;
};

export const resetWidgetMetaEvaluated = (
  payload?: ResetWidgetDescription["payload"],
) => ({
  type: ReduxActionTypes.RESET_WIDGET_META_EVALUATED,
  payload,
});

export const resetWidgetMetaProperty = (
  widgetId: string,
  evaluatedWidget: DataTreeWidget,
  payload?: ResetWidgetDescription["payload"],
): BatchAction<ResetWidgetMetaPayload> => {
  return batchAction({
    type: ReduxActionTypes.RESET_WIDGET_META,
    payload: {
      widgetId,
      evaluatedWidget,
    },
    postEvalActions: [resetWidgetMetaEvaluated(payload)],
  });
};

export const resetChildrenMetaProperty = (
  widgetId: string,
): ReduxAction<{
  widgetId: string;
}> => {
  return {
    type: ReduxActionTypes.RESET_CHILDREN_WIDGET_META,
    payload: {
      widgetId,
    },
  };
};

export const updateMetaState = (evalMetaUpdates: EvalMetaUpdates) => {
  return {
    type: ReduxActionTypes.UPDATE_META_STATE,
    payload: {
      evalMetaUpdates,
    },
  };
};

export const triggerEvalOnMetaUpdate = () => {
  return batchAction({
    type: ReduxActionTypes.META_UPDATE_DEBOUNCED_EVAL,
    payload: {},
  });
};

export const syncUpdateWidgetMetaProperty = (
  widgetId: string,
  propertyName: string,
  propertyValue: unknown,
) => {
  return {
    type: ReduxActionTypes.SET_META_PROP,
    payload: {
      widgetId,
      propertyName,
      propertyValue,
    },
  };
};
