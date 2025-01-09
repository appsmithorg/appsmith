import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { BatchAction } from "actions/batchActions";
import { batchAction } from "actions/batchActions";
import type { EvalMetaUpdates } from "ee/workers/common/DataTreeEvaluator/types";
import type {
  WidgetEntity,
  DataTreeEntityConfig,
  WidgetEntityConfig,
} from "ee/entities/DataTree/types";

export interface UpdateWidgetMetaPropertyPayload {
  widgetId: string;
  propertyName: string;
  propertyValue: unknown;
}

export interface BatchUpdateWidgetMetaPropertyPayload {
  batchMetaUpdates: UpdateWidgetMetaPropertyPayload[];
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

export interface ResetWidgetMetaPayload {
  widgetId: string;
  evaluatedWidget: WidgetEntity | undefined;
  evaluatedWidgetConfig: DataTreeEntityConfig | undefined;
}

export const resetWidgetMetaProperty = (
  widgetId: string,
  evaluatedWidget: WidgetEntity | undefined,
  evaluatedWidgetConfig: WidgetEntityConfig | undefined,
): BatchAction<ResetWidgetMetaPayload> => {
  return batchAction({
    type: ReduxActionTypes.RESET_WIDGET_META,
    payload: {
      widgetId,
      evaluatedWidget,
      evaluatedWidgetConfig,
    },
    postEvalActions: [{ type: ReduxActionTypes.RESET_WIDGET_META_EVALUATED }],
  });
};

export const resetWidgetMetaUpdates = (
  evalMetaUpdates: EvalMetaUpdates,
): BatchAction<ResetWidgetMetaPayload> => {
  return batchAction({
    type: ReduxActionTypes.RESET_WIDGET_META_UPDATES,
    payload: {
      evalMetaUpdates,
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

export const syncBatchUpdateWidgetMetaProperties = (
  batchMetaUpdates: UpdateWidgetMetaPropertyPayload[],
): ReduxAction<BatchUpdateWidgetMetaPropertyPayload> => {
  return {
    type: ReduxActionTypes.BATCH_UPDATE_META_PROPS,
    payload: { batchMetaUpdates },
  };
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

export const resetWidgetsMetaState = (
  widgetIdsToClear: string[],
): ReduxAction<{ widgetIdsToClear: string[] }> => {
  return {
    type: ReduxActionTypes.RESET_WIDGETS_META_STATE,
    payload: {
      widgetIdsToClear,
    },
  };
};
