import { Message, Severity } from "entities/AppsmithConsole";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";

const BlankStateWrapper = styled.div`
  overflow: auto;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #716e6e;

  .debugger-shortcut {
    font-weight: 700;
    color: black;
  }
`;

export const BlankState = (props: { hasShortCut?: boolean }) => {
  return (
    <BlankStateWrapper>
      {!!props.hasShortCut ? (
        <span>
          🎉 Press <span className="debugger-shortcut">Cmd + D</span> to open
          the debugger
        </span>
      ) : (
        <span>No logs to show</span>
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

export const usePagination = (data: Message[], itemsPerPage = 50) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<Message[]>([]);
  const maxPage = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    const data = currentData();
    setPaginatedData(data);
  }, [currentPage, data.length]);

  function currentData() {
    const end = currentPage * itemsPerPage;
    return data.slice(0, end);
  }

  function next() {
    setCurrentPage((currentPage) => {
      const newCurrentPage = Math.min(currentPage + 1, maxPage);
      return newCurrentPage <= 0 ? 1 : newCurrentPage;
    });
  }

  return { next, paginatedData };
};
