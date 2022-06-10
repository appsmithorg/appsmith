import { set } from "lodash";
import { createReducer } from "utils/AppsmithUtils";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

import {
  ReduxActionTypes,
  ReduxAction,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import produce from "immer";
import { EvalMetaUpdates } from "workers/DataTreeEvaluator/types";
import { klona } from "klona";

export type MetaState = Record<string, Record<string, unknown>>;

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
    action: ReduxAction<{ widgetId: string; evaluatedWidget: any }>,
  ) => {
    const { evaluatedWidget, widgetId } = action.payload;
    console.log("$$$", evaluatedWidget);
    const resetMetaObj = {};
    if (evaluatedWidget) {
      const { propertyOverrideDependency } = evaluatedWidget;
      Object.entries(propertyOverrideDependency).map(
        ([propertyName, dependency]) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          const defaultPropertyName = dependency.DEFAULT;
          const defaultPropertyValue = evaluatedWidget[defaultPropertyName];
          if (defaultPropertyValue !== undefined) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            resetMetaObj[propertyName] = klona(defaultPropertyValue);
          }
        },
      );
    }

    if (widgetId in state) {
      return { ...state, [widgetId]: resetMetaObj };
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
