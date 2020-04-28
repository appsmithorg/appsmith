import React from "react";
import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { Datasource } from "api/DatasourcesApi";

const initialState: DatasourcePaneReduxState = {
  selectedPlugin: "",
  datasourceRefs: {},
};

export interface DatasourcePaneReduxState {
  selectedPlugin: string;
  datasourceRefs: {};
}

const datasourcePaneReducer = createReducer(initialState, {
  [ReduxActionTypes.SELECT_PLUGIN]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ pluginId: string }>,
  ) => ({
    ...state,
    selectedPlugin: action.payload.pluginId,
  }),
  [ReduxActionTypes.STORE_DATASOURCE_REFS]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ refsList: {} }>,
  ) => {
    return {
      ...state,
      datasourceRefs: { ...state.datasourceRefs, ...action.payload.refsList },
    };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_REFS]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      datasourceRefs: {
        ...state.datasourceRefs,
        [action.payload.id]: React.createRef(),
      },
    };
  },
});

export default datasourcePaneReducer;
