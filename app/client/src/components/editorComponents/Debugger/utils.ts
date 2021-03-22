import { Message } from "entities/AppsmithConsole";
import { useSelector } from "react-redux";
import { AppState } from "reducers";

export const useFilteredLogs = (filter?: any) => {
  const logs = useSelector((state: AppState) => state.ui.debugger.logs);

  if (filter) {
    return logs.filter((log: Message) => log.severity === filter);
  }

  return logs;
};
