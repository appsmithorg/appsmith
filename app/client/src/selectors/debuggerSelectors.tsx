import { AppState } from "reducers";

export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
