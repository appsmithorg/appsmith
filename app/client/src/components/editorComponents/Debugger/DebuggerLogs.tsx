import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { isUndefined } from "lodash";
import { Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { useFilteredLogs, usePagination } from "./helpers";
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
};

const DebbuggerLogs = (props: Props) => {
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(props.searchQuery);
  const filteredLogs = useFilteredLogs(searchQuery, filter);
  const { paginatedData, next } = usePagination(filteredLogs);
  const listRef = useRef(null);
  const filterOptions = [
    {
      label: "All",
      value: "",
    },
    { label: "Success", value: Severity.INFO },
    { label: "Warnings", value: Severity.WARNING },
    { label: "Errors", value: Severity.ERROR },
  ];
  const selectedFilter = filterOptions.find(
    (option) => option.value === filter,
  );

  function handleScroll(e: any) {
    if (e.target.scrollTop === 0) {
      next();
    }
  }

  useEffect(() => {
    const list: any = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    return () => list.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const div = document.getElementsByClassName("debugger-list")[0];
    if (div) div.scrollTop = div.scrollHeight - div.clientHeight;
  }, [paginatedData.length]);

  return (
    <ContainerWrapper>
      <FilterHeader
        options={filterOptions}
        selected={selectedFilter || filterOptions[0]}
        onChange={setSearchQuery}
        onSelect={(value) => !isUndefined(value) && setFilter(value)}
        defaultValue={props.searchQuery}
        searchQuery={searchQuery}
      />
      <ListWrapper className="debugger-list" ref={listRef}>
        {paginatedData.map((e: any, index: number) => {
          const logItemProps = getLogItemProps(e);

          return (
            <LogItem
              key={`debugger-${index}`}
              {...logItemProps}
              expand={index === paginatedData.length - 1}
            />
          );
        })}
      </ListWrapper>
    </ContainerWrapper>
  );
};

// Set default props
DebbuggerLogs.defaultProps = {
  searchQuery: "",
};

export default DebbuggerLogs;
