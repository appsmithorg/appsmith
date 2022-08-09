export * from "ce/reducers/settingsReducer";
import { handlers, initialState } from "ce/reducers/settingsReducer";
import { createReducer } from "utils/AppsmithUtils";

export default createReducer(initialState, handlers);
