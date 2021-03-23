import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { LogActionPayload } from "entities/AppsmithConsole";

export const debuggerLog = (payload: LogActionPayload) => {
  return {
    type: ReduxActionTypes.DEBUGGER_LOG,
    payload,
  };
};

export const clearLogs = () => {
  return {
    type: ReduxActionTypes.CLEAR_DEBUGGER_LOGS,
  };
};
