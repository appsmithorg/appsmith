export * from "ce/reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/entityReducers/actionsReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import type { ActionDataState } from "ce/reducers/entityReducers/actionsReducer";
import type { Action } from "entities/Action";
import type { Module } from "@appsmith/constants/ModuleConstants";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_MODULE_ACTIONS_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action[]>,
  ) => {
    if (action.payload.length > 0) {
      const result: ActionDataState = [];

      action.payload.forEach((actionPayload: Action) => {
        result.push({
          isLoading: false,
          config: actionPayload,
        });
      });

      return result;
    }
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
};

const initialState: ActionDataState = [];

const actionsReducer = createImmerReducer(initialState, handlers);

export default actionsReducer;
