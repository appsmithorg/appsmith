import { set, merge } from "lodash";
import { createReducer } from "utils/AppsmithUtils";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

import {
  ReduxActionTypes,
  ReduxAction,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import produce from "immer";
import { DataTree } from "entities/DataTree/dataTreeFactory";

export type MetaState = Record<string, Record<string, unknown>>;

export const initialState: MetaState = {};

export const metaReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_META_STATE]: (
    state: MetaState,
    action: ReduxAction<{
      metaUpdates: DataTree;
    }>,
  ) => {
    const { metaUpdates } = action.payload;

    // if metaObject is updated in dataTree we also update meta values, to keep meta state in sync.
    const newMetaState = produce(state, (draftMetaState) => {
      return merge(draftMetaState, metaUpdates);
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
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    const widgetId = action.payload.widgetId;
    if (widgetId in state) {
      const resetData: Record<string, any> = {
        ...state[widgetId],
      };
      Object.keys(resetData).forEach((key: string) => {
        // NOTE:-
        // metaHOC component assumes on reset of widget all metaValues will be deleted.
        // if deletion logic needs to be changed, make sure to also update metaHOC reset condition.
        delete resetData[key];
      });
      return { ...state, [widgetId]: { ...resetData } };
    }
    return state;
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
