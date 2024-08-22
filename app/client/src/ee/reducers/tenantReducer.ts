import { handlers, initialState } from "ce/reducers/tenantReducer";
import { createReducer } from "utils/ReducerUtils";

export * from "ce/reducers/tenantReducer";

export default createReducer(initialState, handlers);
