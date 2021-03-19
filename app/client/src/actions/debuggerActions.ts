import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Message } from "entities/AppsmithConsole";

export const debuggerLog = (payload: Message) => {
  return {
    type: ReduxActionTypes.DEBUGGER_LOG,
    payload,
  };
};
