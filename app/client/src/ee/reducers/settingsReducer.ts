import { handlers, initialState } from "ce/reducers/settingsReducer";
import { createReducer } from "utils/ReducerUtils";

export * from "ce/reducers/settingsReducer";

export default createReducer(initialState, handlers);
