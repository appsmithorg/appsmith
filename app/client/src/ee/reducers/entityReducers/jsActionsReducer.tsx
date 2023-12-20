export * from "ce/reducers/entityReducers/jsActionsReducer";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
import type { Module } from "@appsmith/constants/ModuleConstants";
import {
  ReduxActionTypes,
  type ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import type { JSCollectionDataState } from "ce/reducers/entityReducers/jsActionsReducer";
import {
  handlers as CE_handlers,
  initialState as CE_initialState,
} from "ce/reducers/entityReducers/jsActionsReducer";
import { createReducer } from "utils/ReducerUtils";

const initialState = CE_initialState;

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    state: JSCollectionDataState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    return action.payload.jsCollections.map((action) => ({
      isLoading: false,
      config: action,
      data: undefined,
    }));
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftMetaState: JSCollectionDataState,
    action: ReduxAction<Module>,
  ) => {
    const { id, name } = action.payload;
    draftMetaState.forEach((a) => {
      if (a.config.moduleId === id && a.config.isPublic) {
        a.config.name = name;
      }
    });

    return draftMetaState;
  },
};

const jsActionsReducer = createReducer(initialState, handlers);

export default jsActionsReducer;
