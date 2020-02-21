import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

export type MetaState = Record<string, object>;

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
});

export default metaReducer;
