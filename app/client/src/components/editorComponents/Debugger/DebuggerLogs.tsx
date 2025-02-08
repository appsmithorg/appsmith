import React, { useEffect, useRef, useState, useMemo } from "react";
import type { DefaultTheme } from "styled-components";
import styled, { useTheme } from "styled-components";
import { get, isUndefined } from "lodash";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import FilterHeader from "./FilterHeader";
import { BlankState } from "./helpers";
import { LogItem, getLogItemProps } from "./LogItem";
import { usePagination, useFilteredLogs } from "./hooks/debuggerHooks";
import {
  createMessage,
  LOGS_FILTER_OPTION_ALL,
  LOGS_FILTER_OPTION_CONSOLE,
  LOGS_FILTER_OPTION_ERROR,
  LOGS_FILTER_OPTION_SYSTEM,
  NO_LOGS,
} from "ee/constants/messages";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import bootIntercom from "utils/bootIntercom";
import type { Theme } from "constants/DefaultTheme";
import { thinScrollbar } from "constants/DefaultTheme";
import type { IconName } from "@blueprintjs/core";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getDebuggerSelectedFilter } from "selectors/debuggerSelectors";
import { setDebuggerSelectedFilter } from "actions/debuggerActions";
import { BOTTOM_BAR_HEIGHT } from "components/BottomBar/constants";

export const LIST_HEADER_HEIGHT = "53px";
export const FOOTER_MARGIN = "40px";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: calc(100% - ${BOTTOM_BAR_HEIGHT}px);
`;

export const ListWrapper = styled.div`
  overflow-wrap: anywhere;
  overflow: auto;
  height: calc(100% - ${LIST_HEADER_HEIGHT});
  ${thinScrollbar};
  padding-bottom: 37px;
`;

interface Props {
  searchQuery: string;
  hasShortCut?: boolean;
}

const LOGS_FILTER_OPTIONS = (theme: DefaultTheme) => [
  {
    label: LOGS_FILTER_OPTION_ALL(),
    value: "",
  },
  {
    label: LOGS_FILTER_OPTION_ERROR(),
    value: Severity.ERROR,
    icon: "close-circle" as IconName,
    iconColor: get(theme, "colors.debugger.error.hoverIconColor"),
  },
  {
    label: LOGS_FILTER_OPTION_CONSOLE(),
    value: LOG_CATEGORY.USER_GENERATED,
    icon: "user-2" as IconName,
  },
  {
    label: LOGS_FILTER_OPTION_SYSTEM(),
    value: LOG_CATEGORY.PLATFORM_GENERATED,
    icon: "desktop" as IconName,
  },
];

function DebuggerLogs(props: Props) {
  const [searchQuery, setSearchQuery] = useState(props.searchQuery);
  const filter = useSelector(getDebuggerSelectedFilter);
  const dispatch = useDispatch();
  const filteredLogs = useFilteredLogs(searchQuery, filter);
  const { next, paginatedData } = usePagination(filteredLogs);
  const listRef = useRef<HTMLDivElement>(null);
  const theme = useTheme() as Theme;
  const selectedFilter = useMemo(
    () => LOGS_FILTER_OPTIONS(theme).find((option) => option.value === filter),
    [filter, theme],
  );
  const currentUser = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(currentUser);
  }, [currentUser?.email]);

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

  useEffect(() => {
    setSearchQuery(props.searchQuery);
  }, [props.searchQuery]);

  const handleFilterChange = (filter: string | undefined) => {
    if (!isUndefined(filter)) {
      dispatch(setDebuggerSelectedFilter(filter));

      AnalyticsUtil.logEvent("DEBUGGER_FILTER_CHANGED", {
        filter: filter.length > 0 ? filter : "ALL",
      });
    }
  };

  return (
    <ContainerWrapper>
      <FilterHeader
        defaultValue={props.searchQuery}
        onChange={setSearchQuery}
        onSelect={handleFilterChange}
        options={LOGS_FILTER_OPTIONS(theme)}
        searchQuery={searchQuery}
        selected={selectedFilter || LOGS_FILTER_OPTIONS(theme)[0]}
        value={searchQuery}
      />

      <ListWrapper className="debugger-list" ref={listRef}>
        {!paginatedData.length ? (
          <BlankState
            hasShortCut={!!props.hasShortCut}
            placeholderText={createMessage(NO_LOGS)}
          />
        ) : (
          paginatedData.map((e, index: number) => {
            const logItemProps = getLogItemProps(e);

            return (
              <LogItem
                key={`${e.timestamp}_${index}`}
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
DebuggerLogs.defaultProps = {
  searchQuery: "",
};

export default DebuggerLogs;
