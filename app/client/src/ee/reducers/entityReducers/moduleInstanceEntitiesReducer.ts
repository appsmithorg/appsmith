import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { ActionData } from "./actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";
import type { FetchModuleInstanceEntitiesResponse } from "@appsmith/api/ModuleInstanceApi";

export interface ModuleInstanceEntitiesReducerState {
  actions: ActionData[];
  jsCollections: JSCollectionData[];
}

const initialState: ModuleInstanceEntitiesReducerState = {
  actions: [],
  jsCollections: [],
};

export const handlers = {
  [ReduxActionTypes.FETCH_MODULE_INSTANCE_ENTITIES_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<FetchModuleInstanceEntitiesResponse>,
  ) => {
    return {
      actions: action.payload.actions,
      jsCollections: action.payload.jsCollections,
    };
  },
  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_SETTINGS_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    const index = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (index !== -1) {
      draftState.actions[index].config = action.payload;
    }

    return draftState;
  },
  [ReduxActionTypes.UPDATE_MODULE_INSTANCE_ON_PAGE_LOAD_SETTING_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    const index = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (index !== -1) {
      draftState.actions[index].config = action.payload;
    }

    return draftState;
  },
  [ReduxActionTypes.DELETE_MODULE_INSTANCE_SUCCESS]: (
    draftState: ModuleInstanceEntitiesReducerState,
    action: ReduxAction<Action>,
  ) => {
    const actionsIndex = draftState.actions.findIndex(
      (a) => a.config.id === action.payload.id,
    );
    const jsActionsIndex = draftState.jsCollections.findIndex(
      (a) => a.config.id === action.payload.id,
    );

    if (actionsIndex !== -1) {
      delete draftState.actions[actionsIndex];
    }

    if (jsActionsIndex !== -1) {
      delete draftState.jsCollections[jsActionsIndex];
    }

    return draftState;
  },
};

const moduleInstanceEntitiesReducer = createImmerReducer(
  initialState,
  handlers,
);

export default moduleInstanceEntitiesReducer;
