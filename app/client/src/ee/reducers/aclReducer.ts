export * from "ce/reducers/aclReducer";
import { handlers, initialState } from "ce/reducers/aclReducer";
import { createReducer } from "utils/ReducerUtils";

export default createReducer(initialState, handlers);
