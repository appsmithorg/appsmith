import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

export type MetaState = Record<string, Record<string, unknown>>;

const initialState: MetaState = {};

export const metaReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_META_PROP]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    const next = { ...state };
    let widgetMetaProps: Record<string, any> = next[action.payload.widgetId];
    if (widgetMetaProps === undefined) {
      widgetMetaProps = {};
      next[action.payload.widgetId] = widgetMetaProps;
    }
    (widgetMetaProps as Record<string, any>)[action.payload.propertyName] =
      action.payload.propertyValue;
    return next;
  },
  [ReduxActionTypes.WIDGET_DELETE]: (
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
        resetData[key] = undefined;
      });
      return { ...state, [widgetId]: { ...resetData } };
    }
    return state;
  },
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    return initialState;
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    return initialState;
  },
});

export default metaReducer;
