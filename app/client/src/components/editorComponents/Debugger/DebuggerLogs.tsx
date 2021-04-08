import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { useFilteredLogs } from "./helpers";
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
  const logs = useFilteredLogs(searchQuery, filter);
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

  useEffect(() => {
    const div = document.getElementsByClassName("debugger-list")[0];
    if (div) div.scrollTop = div.scrollHeight - div.clientHeight;
  }, [logs.length]);

  return (
    <ContainerWrapper>
      <FilterHeader
        options={filterOptions}
        selected={selectedFilter || filterOptions[0]}
        onChange={setSearchQuery}
        onSelect={(value) => value && setFilter(value)}
        defaultValue={props.searchQuery}
        searchQuery={searchQuery}
      />
      <ListWrapper className="debugger-list">
        {logs.map((e, index) => {
          const logItemProps = getLogItemProps(e);

          return <LogItem key={`debugger-${index}`} {...logItemProps} />;
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
