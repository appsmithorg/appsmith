import {
  handlers as CE_handlers,
  initialState,
} from "ce/reducers/uiReducers/workspaceReducer";
import { createImmerReducer } from "utils/ReducerUtils";

export * from "ce/reducers/uiReducers/workspaceReducer";

const handlers = {
  ...CE_handlers,
};

const workspaceReducer = createImmerReducer(initialState, handlers);

export default workspaceReducer;
