import { set } from "lodash";
import { createReducer } from "utils/ReducerUtils";
import type {
  UpdateWidgetMetaPropertyPayload,
  ResetWidgetMetaPayload,
  BatchUpdateWidgetMetaPropertyPayload,
} from "actions/metaActions";

import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import produce from "immer";
import type { EvalMetaUpdates } from "@appsmith/workers/common/DataTreeEvaluator/types";
import { getMetaWidgetResetObj } from "./metaReducerUtils";
import type { WidgetEntityConfig } from "entities/DataTree/dataTreeFactory";

export type WidgetMetaState = Record<string, unknown>;
export type MetaState = Record<string, WidgetMetaState>;

export const initialState: MetaState = {};

export const metaReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_META_STATE]: (
    state: MetaState,
    action: ReduxAction<{
      evalMetaUpdates: EvalMetaUpdates;
    }>,
  ) => {
    const { evalMetaUpdates } = action.payload;

    // if metaObject is updated in dataTree we also update meta values, to keep meta state in sync.
    const newMetaState = produce(state, (draftMetaState) => {
      evalMetaUpdates.forEach(({ metaPropertyPath, value, widgetId }) => {
        set(draftMetaState, [widgetId, ...metaPropertyPath], value);
      });
      return draftMetaState;
    });
    return newMetaState;
  },
  [ReduxActionTypes.SET_META_PROP]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    const nextState = produce(state, (draftMetaState) => {
      set(
        draftMetaState,
        `${action.payload.widgetId}.${action.payload.propertyName}`,
        action.payload.propertyValue,
      );
      return draftMetaState;
    });

    return nextState;
  },
  [ReduxActionTypes.BATCH_UPDATE_META_PROPS]: (
    state: MetaState,
    action: ReduxAction<BatchUpdateWidgetMetaPropertyPayload>,
  ) => {
    const nextState = produce(state, (draftMetaState) => {
      const { batchMetaUpdates } = action.payload;
      batchMetaUpdates.forEach(({ propertyName, propertyValue, widgetId }) => {
        set(draftMetaState, `${widgetId}.${propertyName}`, propertyValue);
      });
      return draftMetaState;
    });

    return nextState;
  },
  [ReduxActionTypes.SET_META_PROP_AND_EVAL]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    const nextState = produce(state, (draftMetaState) => {
      set(
        draftMetaState,
        `${action.payload.widgetId}.${action.payload.propertyName}`,
        action.payload.propertyValue,
      );
      return draftMetaState;
    });

    return nextState;
  },
  [ReduxActionTypes.TABLE_PANE_MOVED]: (
    state: MetaState,
    action: ReduxAction<TableFilterPanePositionConfig>,
  ) => {
    const next = { ...state };
    let widgetMetaProps: Record<string, any> = next[action.payload.widgetId];
    if (widgetMetaProps === undefined) {
      widgetMetaProps = {
        isMoved: true,
        position: { ...action.payload.position },
      };
    } else {
      widgetMetaProps = {
        ...widgetMetaProps,
        isMoved: true,
        position: { ...action.payload.position },
      };
    }
    next[action.payload.widgetId] = widgetMetaProps;
    return next;
  },
  [WidgetReduxActionTypes.WIDGET_DELETE]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    const next = { ...state };
    delete next[action.payload.widgetId];
    return next;
  },
  [ReduxActionTypes.RESET_WIDGET_META]: (
    state: MetaState,
    action: ReduxAction<ResetWidgetMetaPayload>,
  ) => {
    const { evaluatedWidget, evaluatedWidgetConfig, widgetId } = action.payload;

    if (widgetId in state) {
      // only reset widgets whose meta properties were changed.
      state = {
        ...state,
        [widgetId]: getMetaWidgetResetObj(
          evaluatedWidget,
          evaluatedWidgetConfig as WidgetEntityConfig,
        ),
      };
    }
    return state;
  },
  [ReduxActionTypes.RESET_WIDGETS_META_STATE]: (
    state: MetaState,
    action: ReduxAction<{ widgetIdsToClear: string[] }>,
  ) => {
    const next = { ...state };
    for (const metaWidgetId of action.payload.widgetIdsToClear) {
      if (metaWidgetId && next[metaWidgetId]) {
        delete next[metaWidgetId];
      }
    }
    return next;
  },
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: () => {
    return initialState;
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: () => {
    return initialState;
  },
});

interface TableFilterPanePositionConfig {
  widgetId: string;
  isMoved: boolean;
  position: {
    left: number;
    top: number;
  };
}

export default metaReducer;
