import { set, cloneDeep } from "lodash";
import { createReducer } from "utils/AppsmithUtils";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";
import isObject from "lodash/isObject";
import { DataTreeWidget } from "entities/DataTree/dataTreeFactory";
import {
  ReduxActionTypes,
  ReduxAction,
  WidgetReduxActionTypes,
} from "constants/ReduxActionConstants";

export type MetaState = Record<string, Record<string, unknown>>;

const initialState: MetaState = {};

export const metaReducer = createReducer(initialState, {
  [ReduxActionTypes.UPDATE_META_STATE]: (
    state: MetaState,
    action: ReduxAction<{
      updatedWidgetMetaState: Record<string, DataTreeWidget>;
    }>,
  ) => {
    // if metaObject is updated in dataTree we also update meta values, to keep meta state in sync.
    const newMetaState = cloneDeep(state);
    const { updatedWidgetMetaState } = action.payload;

    Object.entries(updatedWidgetMetaState).forEach(
      ([entityWidgetId, entityMetaState]) => {
        if (isObject(newMetaState[entityWidgetId])) {
          Object.keys(newMetaState[entityWidgetId]).forEach((key) => {
            if (key in entityMetaState) {
              newMetaState[entityWidgetId][key] = entityMetaState[key];
            }
          });
        }
      },
    );
    return newMetaState;
  },
  [ReduxActionTypes.SET_META_PROP]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    const next = cloneDeep(state);

    set(
      next,
      `${action.payload.widgetId}.${action.payload.propertyName}`,
      action.payload.propertyValue,
    );

    return next;
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
