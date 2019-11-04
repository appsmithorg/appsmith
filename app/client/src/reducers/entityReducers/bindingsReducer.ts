import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { NamePathBindingMap } from "../../constants/BindingsConstants";

export type BindingsDataState = NamePathBindingMap;

const initialState: BindingsDataState = {};

const bindingsReducer = createReducer(initialState, {
  [ReduxActionTypes.CREATE_UPDATE_BINDINGS_MAP_SUCCESS]: (
    state: BindingsDataState,
    action: ReduxAction<NamePathBindingMap>,
  ) => action.payload,
});

export default bindingsReducer;
