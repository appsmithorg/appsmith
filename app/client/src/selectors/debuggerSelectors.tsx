import { AppState } from "reducers";

export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
