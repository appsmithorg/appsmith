import { createImmerReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { Action } from "entities/Action";
import type { ActionData } from "./actionsReducer";
import type { JSCollectionData } from "reducers/entityReducers/jsActionsReducer";

export interface ModuleInstanceEntitiesReducerState {
  actions: ActionData[];
  jsCollections: JSCollectionData[];
}

const initialState: ModuleInstanceEntitiesReducerState = {
  actions: [],
  jsCollections: [],
};

export const handlers = {
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
};

const moduleInstanceEntitiesReducer = createImmerReducer(
  initialState,
  handlers,
);

export default moduleInstanceEntitiesReducer;
