import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "constants/ReduxActionConstants";
import get from "lodash/get";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

export interface ExplorerReduxState {
  entity: {
    updatingEntity?: string;
    updateEntityError?: string;
    editingEntityName?: string;
  };
  pinned: boolean;
  width: number | undefined;
  active: boolean;
  entityInfo: {
    show: boolean;
    entityType?: ENTITY_TYPE;
    entityId: string;
    entityName?: string;
  };
}

const initialState: ExplorerReduxState = {
  pinned: true,
  entity: {},
  width: undefined,
  active: true,
  entityInfo: {
    show: false,
    entityId: "",
  },
};

const setEntityInfo = (
  state: ExplorerReduxState,
  action: ReduxAction<{ entityId: string; entityType: ENTITY_TYPE }>,
) => ({
  ...state,
  entityInfo: {
    ...action.payload,
  },
});

const setUpdatingEntity = (
  state: ExplorerReduxState,
  action: ReduxAction<{ id: string }>,
) => {
  return {
    ...state,
    entity: { updatingEntity: action.payload.id, updateEntityError: undefined },
  };
};

const setEntityUpdateError = (state: ExplorerReduxState) => {
  return {
    ...state,
    entity: {
      updatingEntity: undefined,
      updateEntityError: state.entity.updatingEntity,
    },
  };
};

const setEntityUpdateSuccess = (state: ExplorerReduxState) => {
  return { ...state, entity: {} };
};

const setUpdatingDatasourceEntity = (
  state: ExplorerReduxState,
  action: ReduxAction<{ id: string }>,
) => {
  const pathParts = window.location.pathname.split("/");
  const pageId = pathParts[pathParts.indexOf("pages") + 1];

  if (!get(state, "entity.updatingEntity", "")?.includes(action.payload.id)) {
    return {
      ...state,
      entity: {
        updatingEntity: `${action.payload.id}-${pageId}`,
        updateEntityError: undefined,
      },
    };
  }

  return state;
};

const explorerReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.FETCH_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.CLONE_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.CLONE_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.CLONE_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.MOVE_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.MOVE_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.MOVE_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.COPY_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.COPY_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.COPY_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_ACTION_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.DELETE_ACTION_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_ACTION_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.DELETE_DATASOURCE_INIT]: setUpdatingDatasourceEntity,
  [ReduxActionErrorTypes.DELETE_DATASOURCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.DELETE_DATASOURCE_SUCCESS]: setEntityUpdateSuccess,
  [ReduxActionTypes.DELETE_DATASOURCE_CANCELLED]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_DATASOURCE_INIT]: setUpdatingDatasourceEntity,
  [ReduxActionErrorTypes.UPDATE_DATASOURCE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_DATASOURCE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_INIT]: setUpdatingDatasourceEntity,
  [ReduxActionErrorTypes.FETCH_DATASOURCE_STRUCTURE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.FETCH_DATASOURCE_STRUCTURE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_INIT]: setUpdatingDatasourceEntity,
  [ReduxActionErrorTypes.REFRESH_DATASOURCE_STRUCTURE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.REFRESH_DATASOURCE_STRUCTURE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SET_DEFAULT_APPLICATION_PAGE_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SET_DEFAULT_APPLICATION_PAGE_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.UPDATE_WIDGET_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.UPDATE_WIDGET_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.UPDATE_WIDGET_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SAVE_ACTION_NAME_INIT]: setUpdatingEntity,
  [ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR]: setEntityUpdateError,
  [ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS]: setEntityUpdateSuccess,

  [ReduxActionTypes.SET_ENTITY_INFO]: setEntityInfo,

  [ReduxActionTypes.INIT_EXPLORER_ENTITY_NAME_EDIT]: (
    state: ExplorerReduxState,
    action: ReduxAction<{ id: string }>,
  ) => {
    return { ...state, entity: { editingEntityName: action.payload.id } };
  },
  [ReduxActionTypes.END_EXPLORER_ENTITY_NAME_EDIT]: (
    state: ExplorerReduxState,
  ) => {
    return { ...state, entity: {} };
  },
  [ReduxActionTypes.SET_EXPLORER_PINNED]: (
    state: ExplorerReduxState,
    action: ReduxAction<{ shouldPin: boolean }>,
  ) => {
    return { ...state, pinned: action.payload.shouldPin };
  },
  [ReduxActionTypes.UPDATE_EXPLORER_WIDTH]: (
    state: ExplorerReduxState,
    action: ReduxAction<{ width: number | undefined }>,
  ) => {
    return { ...state, width: action.payload.width };
  },
  [ReduxActionTypes.SET_EXPLORER_ACTIVE]: (
    state: ExplorerReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      active: action.payload,
    };
  },
});

export default explorerReducer;
