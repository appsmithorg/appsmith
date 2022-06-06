import React, { useEffect, useState, useMemo, useRef } from "react";
import styled from "styled-components";
import { isUndefined } from "lodash";
import { Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { BlankState } from "./helpers";
// import { createMessage, NO_LOGS } from "@appsmith/constants/messages";
import { Console } from "console-feed";
import { thinScrollbar } from "constants/DefaultTheme";
import { usePagination } from "./hooks/debuggerHooks";
import { Message } from "workers/UserLog";

const LIST_HEADER_HEIGHT = "38px";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

export const ListWrapper = styled.div`
  overflow: auto;
  height: calc(100% - ${LIST_HEADER_HEIGHT});
  ${thinScrollbar};
  padding-bottom: 25px;
`;

type Props = {
  searchQuery: string;
  logs: Message[];
  hasShortCut?: boolean;
};

const LOGS_FILTER_OPTIONS = [
  {
    label: "All",
    value: "",
  },
  { label: "Info", value: Severity.INFO },
  { label: "Warnings", value: Severity.WARNING },
  { label: "Errors", value: Severity.ERROR },
];

function ConsoleTab(props: Props) {
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(props.searchQuery);
  const listRef = useRef<HTMLDivElement>(null);
  const { next } = usePagination([]);
  const selectedFilter = useMemo(
    () => LOGS_FILTER_OPTIONS.find((option) => option.value === filter),
    [filter],
  );

  const handleScroll = (e: Event) => {
    if ((e.target as HTMLDivElement).scrollTop === 0) {
      next();
    }
  };

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ContainerWrapper>
      <FilterHeader
        defaultValue={props.searchQuery}
        onChange={setSearchQuery}
        onSelect={(value) => !isUndefined(value) && setFilter(value)}
        options={LOGS_FILTER_OPTIONS}
        searchQuery={searchQuery}
        selected={selectedFilter || LOGS_FILTER_OPTIONS[0]}
      />

      <ListWrapper className="debugger-list" ref={listRef}>
        {!props.logs.length ? (
          <BlankState placeholderText="No logs to show" />
        ) : (
          <Console key={Math.random()} logs={props.logs} variant="light" />
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

// Set default props
ConsoleTab.defaultProps = {
  searchQuery: "",
};

export default ConsoleTab;
