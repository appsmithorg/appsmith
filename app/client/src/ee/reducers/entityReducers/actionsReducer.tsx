export * from "ce/reducers/entityReducers/actionsReducer";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { handlers as CE_handlers } from "ce/reducers/entityReducers/actionsReducer";
import { createImmerReducer } from "utils/ReducerUtils";
import type { ActionDataState } from "ce/reducers/entityReducers/actionsReducer";
import type { Action } from "entities/Action";
import _ from "lodash";
import type { Module } from "@appsmith/constants/ModuleConstants";

const handlers = {
  ...CE_handlers,
  [ReduxActionTypes.FETCH_MODULE_ACTIONS_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Action[]>,
  ) => {
    if (action.payload.length > 0) {
      const stateActionMap = _.keyBy(draftMetaState, "config.id");
      const result: ActionDataState = [];

      action.payload.forEach((actionPayload: Action) => {
        const stateAction = stateActionMap[actionPayload.id];
        if (stateAction) {
          result.push({
            data: stateAction.data,
            isLoading: false,
            config: actionPayload,
          });

          delete stateActionMap[actionPayload.id];
        } else {
          result.push({
            isLoading: false,
            config: actionPayload,
          });
        }
      });

      Object.keys(stateActionMap).forEach((stateActionKey) => {
        result.push(stateActionMap[stateActionKey]);
      });

      return result;
    }
  },
  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<any>,
  ) => {
    draftMetaState.push({
      config: action.payload.entity,
      isLoading: false,
    });

    return draftMetaState;
  },
  [ReduxActionTypes.SAVE_MODULE_NAME_SUCCESS]: (
    draftMetaState: ActionDataState,
    action: ReduxAction<Module>,
  ) => {
    const { name, publicEntityId } = action.payload;
    draftMetaState.forEach((a) => {
      if (a.config.id === publicEntityId) {
        a.config.name = name;
      }
    });

    return draftMetaState;
  },
};

const initialState: ActionDataState = [];

const actionsReducer = createImmerReducer(initialState, handlers);

export default actionsReducer;
