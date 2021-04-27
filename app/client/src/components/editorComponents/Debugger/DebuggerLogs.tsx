import React, { useEffect, useRef, useState, useMemo } from "react";
import styled from "styled-components";
import { isUndefined } from "lodash";
import { Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { BlankState, useFilteredLogs, usePagination } from "./helpers";
import LogItem, { getLogItemProps } from "./LogItem";

const LIST_HEADER_HEIGHT = "38px";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  height: calc(100% - ${LIST_HEADER_HEIGHT});
`;

type Props = {
  searchQuery: string;
  hasShortCut?: boolean;
};

const LOGS_FILTER_OPTIONS = [
  {
    label: "All",
    value: "",
  },
  { label: "Success", value: Severity.INFO },
  { label: "Warnings", value: Severity.WARNING },
  { label: "Errors", value: Severity.ERROR },
];

function DebbuggerLogs(props: Props) {
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(props.searchQuery);
  const filteredLogs = useFilteredLogs(searchQuery, filter);
  const { paginatedData, next } = usePagination(filteredLogs);
  const listRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      setTimeout(() => {
        list.scrollTop = list.scrollHeight - list.clientHeight;
      }, 0);
    }
  }, [paginatedData.length]);

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
        {!paginatedData.length ? (
          <BlankState hasShortCut={!!props.hasShortCut} />
        ) : (
          paginatedData.map((e, index: number) => {
            const logItemProps = getLogItemProps(e);

            return (
              <LogItem
                key={`debugger-${index}`}
                {...logItemProps}
                expand={index === paginatedData.length - 1}
              />
            );
          })
        )}
      </ListWrapper>
    </ContainerWrapper>
  );
}

// Set default props
DebbuggerLogs.defaultProps = {
  searchQuery: "",
};

export default DebbuggerLogs;
