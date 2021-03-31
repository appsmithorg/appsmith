import { Message, Severity } from "entities/AppsmithConsole";
import { useSelector } from "react-redux";
import { AppState } from "reducers";

export const SeverityColor: Record<Severity, string> = {
  [Severity.INFO]: "rgba(3, 179, 101, 0.09)",
  [Severity.ERROR]: "rgba(242, 43, 43, 0.08)",
  [Severity.WARNING]: "rgba(254, 184, 17, 0.1)",
};

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

export const SeverityIconColor: Record<Severity, string> = {
  [Severity.INFO]: "#03B365",
  [Severity.ERROR]: "rgb(255, 255, 255)",
  [Severity.WARNING]: "rgb(224, 179, 14)",
};

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
