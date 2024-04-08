export * from "ce/reducers/uiReducers/selectedWorkspaceReducer";
import {
  handlers as CE_handlers,
  initialState,
} from "ce/reducers/uiReducers/selectedWorkspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";

const handlers = {
  ...CE_handlers,
};

const selectedWorkspaceReducer = createImmerReducer(initialState, handlers);

export default selectedWorkspaceReducer;
