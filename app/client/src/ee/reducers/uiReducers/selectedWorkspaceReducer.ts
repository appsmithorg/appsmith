import {
  handlers as CE_handlers,
  initialState,
} from "ce/reducers/uiReducers/selectedWorkspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export * from "ce/reducers/uiReducers/selectedWorkspaceReducer";

const handlers = {
  ...CE_handlers,
};

const selectedWorkspaceReducer = createImmerReducer(initialState, handlers);

export default selectedWorkspaceReducer;
