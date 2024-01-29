export * from "ce/reducers/settingsReducer";
import { handlers, initialState } from "ce/reducers/settingsReducer";
import { createReducer } from "utils/ReducerUtils";

export default createImmerReducer(initialState, handlers);
