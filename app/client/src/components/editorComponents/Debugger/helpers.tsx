import { Message, Severity } from "entities/AppsmithConsole";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  createMessage,
  NO_LOGS,
  OPEN_THE_DEBUGGER,
  PRESS,
} from "constants/messages";

const BlankStateWrapper = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${(props) => props.theme.colors.debugger.blankState.color};
  ${(props) => getTypographyByKey(props, "p1")}

  .debugger-shortcut {
    color: ${(props) => props.theme.colors.debugger.blankState.shortcut};
    ${(props) => getTypographyByKey(props, "h5")}
  }
`;

export const BlankState = (props: { hasShortCut?: boolean }) => {
  return (
    <BlankStateWrapper>
      {props.hasShortCut ? (
        <span>
          {createMessage(PRESS)}
          <span className="debugger-shortcut">Cmd + D</span>
          {createMessage(OPEN_THE_DEBUGGER)}
        </span>
      ) : (
        <span>{createMessage(NO_LOGS)}</span>
      )}
    </BlankStateWrapper>
  );
};

export const SeverityIcon: Record<Severity, string> = {
  [Severity.INFO]: "success",
  [Severity.ERROR]: "error",
  [Severity.WARNING]: "warning",
};

export const SeverityIconColor: Record<Severity, string> = {
  [Severity.INFO]: "#03B365",
  [Severity.ERROR]: "#F22B2B",
  [Severity.WARNING]: "rgb(224, 179, 14)",
};

export const useFilteredLogs = (query: string, filter?: any) => {
  let logs = useSelector((state: AppState) => state.ui.debugger.logs);

  if (filter) {
    logs = logs.filter((log: Message) => log.severity === filter);
  }

  if (query) {
    logs = logs.filter((log: Message) => {
      if (log.source?.name)
        return (
          log.source?.name.toUpperCase().indexOf(query.toUpperCase()) !== -1
        );
    });
  }

  return logs;
};

export const usePagination = (data: Message[], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<Message[]>([]);
  const maxPage = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    const data = currentData();
    setPaginatedData(data);
  }, [currentPage, data.length]);

  const currentData = useCallback(() => {
    const end = currentPage * itemsPerPage;
    return data.slice(0, end);
  }, [data]);

  const next = useCallback(() => {
    setCurrentPage((currentPage) => {
      const newCurrentPage = Math.min(currentPage + 1, maxPage);
      return newCurrentPage <= 0 ? 1 : newCurrentPage;
    });
  }, []);

  return { next, paginatedData };
};
