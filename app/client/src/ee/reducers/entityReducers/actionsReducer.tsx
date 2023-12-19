export * from "ce/reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/entityReducers/actionsReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import type { ActionDataState } from "ce/reducers/entityReducers/actionsReducer";
import type { Action } from "entities/Action";
import type { Module } from "@appsmith/constants/ModuleConstants";
import type { DeleteModulePayload } from "@appsmith/actions/moduleActions";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_MODULE_ENTITIES_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<FetchModuleEntitiesResponse>,
  ) => {
    const result: ActionDataState = [];

    action.payload.actions.forEach((actionPayload: Action) => {
      result.push({
        isLoading: false,
        config: actionPayload,
      });
    });

    return result;
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftMetaState: ActionDataState,
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
  [ReduxActionTypes.DELETE_QUERY_MODULE_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<DeleteModulePayload>,
  ) => {
    const { id: moduleId } = action.payload;

    return draftMetaState.filter(
      (a) => a.config.moduleId !== moduleId && a.config.isPublic,
    );
  },
};

const initialState: ActionDataState = [];

const actionsReducer = createImmerReducer(initialState, handlers);

export default actionsReducer;
