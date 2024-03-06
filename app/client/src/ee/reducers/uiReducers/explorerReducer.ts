export * from "ce/reducers/uiReducers/explorerReducer";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import type { FetchPackageResponse } from "@appsmith/api/PackageApi";
import type { ModuleMetadata } from "@appsmith/constants/ModuleConstants";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import type { ExplorerReduxState as CE_ExplorerReduxState } from "ce/reducers/uiReducers/explorerReducer";
import {
  initialState as CE_initialState,
  handlers as CE_handlers,
  setUpdatingEntity,
  setEntityUpdateError,
  setEntityUpdateSuccess,
} from "ce/reducers/uiReducers/explorerReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export interface ExplorerReduxState extends CE_ExplorerReduxState {
  modulesMetadata: Record<string, ModuleMetadata>;
}

const initialState = {
  ...CE_initialState,
  modulesMetadata: {},
};

export const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.DELETE_QUERY_MODULE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_QUERY_MODULE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_MODULE_INSTANCE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_MODULE_INSTANCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_MODULE_INSTANCE_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_MODULE_INSTANCE_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.FETCH_PACKAGE_SUCCESS]: (
    draftState: ExplorerReduxState,
    action: ReduxAction<FetchPackageResponse>,
  ) => {
    const { modulesMetadata } = action.payload;
    modulesMetadata.forEach((moduleMetadata) => {
      draftState.modulesMetadata[moduleMetadata.moduleId] = moduleMetadata;
    });

    return draftState;
  },

  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    draftState: ExplorerReduxState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    const { actions } = action.payload;
    actions.forEach((action) => {
      if (action.moduleId && !draftState.modulesMetadata[action.moduleId]) {
        draftState.modulesMetadata[action.moduleId] = {
          moduleId: action.moduleId,
          datasourceId: action.datasource.id,
          pluginId: action.pluginId,
          pluginType: action.pluginType,
        };
      }
    });

    return draftState;
  },
};

/**
 * Context Reducer to store states of different components of editor
 */
const editorContextReducer = createImmerReducer(initialState, handlers);

export default editorContextReducer;
