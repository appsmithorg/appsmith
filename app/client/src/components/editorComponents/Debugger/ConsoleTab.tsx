import React, { useEffect, useState, useMemo, useRef } from "react";
import styled from "styled-components";
import { isUndefined } from "lodash";
import { Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { BlankState } from "./helpers";
// import { createMessage, NO_LOGS } from "@appsmith/constants/messages";
import { Console, Decode, Hook, Unhook } from "console-feed";
import { thinScrollbar } from "constants/DefaultTheme";
import { usePagination } from "./hooks/debuggerHooks";

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

function ConsoleTab(props: Props) {
  const [logs, setLogs] = useState<any>([]);
  const [discardedLogs, setDiscardedLogs] = useState<any>([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(props.searchQuery);
  const listRef = useRef<HTMLDivElement>(null);
  const { next } = usePagination([logs]);
  const selectedFilter = useMemo(
    () => LOGS_FILTER_OPTIONS.find((option) => option.value === filter),
    [filter],
  );

  function getNumberStringWithWidth(num: number, width: number) {
    const str = num.toString();
    if (width > str.length) return "0".repeat(width - str.length) + str;
    return str.substr(0, width);
  }

  function getTimestamp() {
    const date = new Date();
    const h = getNumberStringWithWidth(date.getHours(), 2);
    const min = getNumberStringWithWidth(date.getMinutes(), 2);
    const sec = getNumberStringWithWidth(date.getSeconds(), 2);
    const ms = getNumberStringWithWidth(date.getMilliseconds(), 3);
    return `${h}:${min}:${sec}.${ms}`;
  }

  // run once!
  useEffect(() => {
    const hookedConsole = Hook(console, (log) => {
      const decoded = Decode(log);
      if (!decoded) {
        setDiscardedLogs([...discardedLogs, log]);
        return;
      }
      decoded.timestamp = getTimestamp();
      setLogs((currLogs: any) => [...currLogs, decoded]);
    });

    global.console.log("test", hookedConsole);
    return () => {
      Unhook(hookedConsole);
    };
  }, []);

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
      <p>{logs.length}</p>
      <p>{JSON.stringify(discardedLogs)}</p>
      <FilterHeader
        defaultValue={props.searchQuery}
        onChange={setSearchQuery}
        onSelect={(value) => !isUndefined(value) && setFilter(value)}
        options={LOGS_FILTER_OPTIONS}
        searchQuery={searchQuery}
        selected={selectedFilter || LOGS_FILTER_OPTIONS[0]}
      />

      <ListWrapper className="debugger-list" ref={listRef}>
        {!logs.length ? (
          <BlankState placeholderText="No console life" />
        ) : (
          <Console key={Math.random()} logs={logs} variant="light" />
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
