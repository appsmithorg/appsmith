export * from "ce/reducers/organizationReducer";
import { handlers, initialState } from "ce/reducers/organizationReducer";
import { createReducer } from "utils/ReducerUtils";

export default createReducer(initialState, handlers);
