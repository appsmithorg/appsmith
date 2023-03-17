import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Datasource } from "entities/Datasource";
import _ from "lodash";

const initialState: DatasourcePaneReduxState = {
  drafts: {},
  actionRouteInfo: {},
  expandDatasourceId: "",
  newDatasource: "",
  viewMode: true,
  collapsibleState: {},
  defaultKeyValueArrayConfig: [],
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
  viewMode: boolean;
  collapsibleState: Record<string, boolean>;
  defaultKeyValueArrayConfig: Array<string>;
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
    newDatasource: "",
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
      expandDatasourceId: action.payload.id,
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
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      viewMode: action.payload,
    };
  },
  [ReduxActionTypes.SET_DATASOURCE_COLLAPSIBLE_STATE]: (
    state: DatasourcePaneReduxState,
    action: { payload: { key: string; isOpen: boolean } },
  ) => {
    return {
      ...state,
      collapsibleState: {
        ...state.collapsibleState,
        [action.payload.key]: action.payload.isOpen,
      },
    };
  },
  [ReduxActionTypes.SET_ALL_DATASOURCE_COLLAPSIBLE_STATE]: (
    state: DatasourcePaneReduxState,
    action: { payload: { [key: string]: boolean } },
  ) => {
    return {
      ...state,
      collapsibleState: action.payload,
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
  [ReduxActionTypes.SET_DATASOURCE_DEFAULT_KEY_VALUE_PAIR_SET]: (
    state: DatasourcePaneReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      defaultKeyValueArrayConfig: state.defaultKeyValueArrayConfig.concat(
        action.payload,
      ),
    };
  },
  [ReduxActionTypes.RESET_DATASOURCE_DEFAULT_KEY_VALUE_PAIR_SET]: (
    state: DatasourcePaneReduxState,
  ) => {
    return {
      ...state,
      defaultKeyValueArrayConfig: [],
    };
  },
});

export default datasourcePaneReducer;
