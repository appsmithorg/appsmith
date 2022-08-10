import { createReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { Datasource } from "entities/Datasource";
import _ from "lodash";

const initialState: DatasourcePaneReduxState = {
  drafts: {},
  actionRouteInfo: {},
  expandDatasourceId: "",
  newDatasource: "",
  viewMode: {},
};

export interface DatasourcePaneReduxState {
  drafts: Record<string, Datasource>;
  expandDatasourceId: string;
  actionRouteInfo: Partial<{
    apiId: string;
    datasourceId: string;
    pageId: string;
    applicationId: string;
  }>;
  newDatasource: string;
  viewMode: Record<string, boolean>;
}

const datasourcePaneReducer = createReducer(initialState, {
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
  [ReduxActionTypes.STORE_AS_DATASOURCE_UPDATE]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{
      apiId: string;
      datasourceId: string;
      pageId: string;
      applicationId: string;
    }>,
  ) => {
    return {
      ...state,
      actionRouteInfo: action.payload,
    };
  },
  [ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE]: (
    state: DatasourcePaneReduxState,
  ) => ({
    ...state,
    actionRouteInfo: {},
  }),
  [ReduxActionTypes.CREATE_DATASOURCE_SUCCESS]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return {
      ...state,
      newDatasource: action.payload.id,
    };
  },
  [ReduxActionTypes.SAVE_DATASOURCE_NAME_SUCCESS]: (
    state: DatasourcePaneReduxState,
  ) => {
    return {
      ...state,
      newDatasource: "",
    };
  },
  [ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<Datasource>,
  ) => {
    return {
      ...state,
      newDatasource: "",
      expandDatasourceId: action.payload.id,
    };
  },
  [ReduxActionTypes.SET_DATASOURCE_EDITOR_MODE]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<{ id: string; viewMode: boolean }>,
  ) => {
    return {
      ...state,
      viewMode: {
        ...state.viewMode,
        [action.payload.id]: action.payload.viewMode,
      },
    };
  },
  [ReduxActionTypes.EXPAND_DATASOURCE_ENTITY]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      expandDatasourceId: action.payload,
    };
  },
});

export default datasourcePaneReducer;
