export * from "ce/reducers/uiReducers/editorContextReducer";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import {
  handlers as CE_handlers,
  type EditorContextState,
  entitySections,
  initialState,
} from "ce/reducers/uiReducers/editorContextReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export const handlers = {
  ...CE_handlers,

  [ReduxActionTypes.CREATE_QUERY_MODULE_SUCCESS]: (
    state: EditorContextState,
  ) => {
    state.entityCollapsibleFields[entitySections.Queries] = true;
  },
};

/**
 * Context Reducer to store states of different components of editor
 */
export const editorContextReducer = createImmerReducer(initialState, handlers);
