import { createImmerReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

export type MetaState = Record<string, object>;

const initialState: MetaState = {};

export const metaReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.SET_META_PROP]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    let widgetMetaProps: Record<string, any> = state[action.payload.widgetId];
    if (widgetMetaProps === undefined) {
      widgetMetaProps = {};
      state[action.payload.widgetId] = widgetMetaProps;
    }
    (widgetMetaProps as Record<string, any>)[action.payload.propertyName] =
      action.payload.propertyValue;
    return;
  },
  [ReduxActionTypes.WIDGET_DELETE]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    delete state[action.payload.widgetId];
    return;
  },
  [ReduxActionTypes.RESET_WIDGET_META]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    const widgetId = action.payload.widgetId;
    if (widgetId in state) {
      Object.keys(state[widgetId]).forEach((key: string) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        state[widgetId][key] = undefined;
      });
      return;
    }
    return;
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
