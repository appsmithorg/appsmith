import { Message } from "entities/AppsmithConsole";
import { useSelector } from "react-redux";
import { AppState } from "reducers";

export const useFilteredLogs = (query: string, filter?: any) => {
  const logs = useSelector((state: AppState) => state.ui.debugger.logs);
  let filteredLogs = [...logs];

  if (filter) {
    filteredLogs = filteredLogs.filter(
      (log: Message) => log.severity === filter,
    );
  }

  if (query) {
    filteredLogs = filteredLogs.filter((log: Message) => {
      if (log.source?.name)
        return log.source?.name.toUpperCase().indexOf(query.toUpperCase()) < 0
          ? false
          : true;
    });
  }

  return filteredLogs;
};
