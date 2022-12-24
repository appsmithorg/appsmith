export * from "ce/reducers/tenantReducer";
import { handlers, initialState } from "ce/reducers/tenantReducer";
import { createReducer } from "utils/ReducerUtils";

export default createReducer(initialState, handlers);
