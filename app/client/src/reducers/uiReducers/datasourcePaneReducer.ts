import React from "react";
import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { Datasource } from "api/DatasourcesApi";
import _ from "lodash";

const initialState: DatasourcePaneReduxState = {
  selectedPlugin: "",
  datasourceRefs: {},
  drafts: {},
};

export interface DatasourcePaneReduxState {
  selectedPlugin: string;
  datasourceRefs: {};
  drafts: Record<string, Datasource>;
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
  [ReduxActionTypes.UPDATE_DATASOURCE_DRAFT]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ id: string; draft: Partial<Datasource> }>,
  ) => {
    return {
      ...state,
      drafts: {
        ...state.drafts,
        [action.payload.id]: action.payload.draft,
      },
    };
  },
  [ReduxActionTypes.DELETE_DATASOURCE_DRAFT]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => ({
    ...state,
    drafts: _.omit(state.drafts, action.payload.id),
  }),
});

export default datasourcePaneReducer;
