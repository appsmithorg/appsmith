export * from "ce/reducers/entityReducers/jsActionsReducer";
import type { FetchModuleEntitiesResponse } from "@appsmith/api/ModuleApi";
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
    const result: JSCollectionDataState = [];
    action.payload.jsCollections.forEach((action) => {
      result.push({
        isLoading: false,
        config: action.isPublic
          ? {
              ...action,
              isMainJSCollection: true,
              displayName: "Main",
            }
          : action,
        data: undefined,
      });
    });

    return result;
  },
};

const jsActionsReducer = createReducer(initialState, handlers);

export default jsActionsReducer;
