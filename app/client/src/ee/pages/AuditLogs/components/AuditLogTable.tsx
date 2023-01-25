import React, { useEffect } from "react";
import AuditLogsTableRow from "@appsmith/pages/AuditLogs/components/AuditLogsTableRow";
import LoadingAuditLogs from "./LoadingAuditLogs";
import NoAuditLogs from "./NoAuditLogs";
import useIntersectionObserver from "../hooks/useIntersectionObserver";
import { AuditLogType } from "../types";
import { DATE_SORT_ORDER } from "@appsmith/reducers/auditLogsReducer";
import { Icon, IconSize } from "design-system-old";
import { StyledAuditLogsTableContainer as Table } from "../styled-components/container";
import {
  StyledAuditLogsTableHead as THead,
  StyledDateColumnContainer as Date,
  StyledEventDescriptionColumnContainer as Event,
  StyledUserColumnContainer as User,
} from "../styled-components/table";
import {
  fetchAuditLogsLogsInit as fetchLogs,
  fetchAuditLogsLogsNextPage as fetchNext,
  setAuditLogsDateSortOrder as setSort,
} from "@appsmith/actions/auditLogsAction";
import {
  selectAuditLogsData as selectData,
  selectAuditLogsSearchFilters as selectFilters,
} from "@appsmith/selectors/auditLogsSelectors";
import { useDispatch, useSelector } from "react-redux";
import { useGoToTop } from "../hooks/useGoToTop";
import { AUDIT_LOGS_PAGE_SIZE } from "../config/audit-logs-config";
import { createMessage } from "design-system-old/build/constants/messages";
import {
  DATE_LABEL,
  EVENT_DESCRIPTION_LABEL,
  USER_LABEL,
} from "@appsmith/constants/messages";

export function AuditLogTable() {
  const { hasMore, isLoading, logs } = useSelector(selectData);
  const searchFilters = useSelector(selectFilters);
  const dateSortOrder = searchFilters?.dateSortOrder;
  const dispatch = useDispatch();
  const { containerRef, endMarkerRef, page } = useIntersectionObserver(
    logs,
    hasMore,
  );
  useEffect(() => {
    if (!isLoading && hasMore) {
      loadMoreLogs();
    }
  }, [page]);

  const { goToTop } = useGoToTop();

  function handleDateSortOrderClick() {
    const newOrder =
      dateSortOrder == ("DESC" as DATE_SORT_ORDER.DESC)
        ? DATE_SORT_ORDER.ASC
        : DATE_SORT_ORDER.DESC;
    dispatch(
      setSort({
        sort: newOrder,
      }),
    );
    searchFilters.dateSortOrder = newOrder;
    /* now fetch the logs */
    dispatch(fetchLogs(searchFilters));
    goToTop();
  }

  function loadMoreLogs(cr?: string) {
    const cursor = cr || (logs.length > 0 ? logs[logs.length - 1].id : "");
    if (logs.length >= AUDIT_LOGS_PAGE_SIZE) {
      dispatch(fetchNext({ ...searchFilters, cursor }));
    }
  }

  const rows = logs.map((log: AuditLogType) => (
    <AuditLogsTableRow
      className="audit-logs-table-row"
      data-testid={`audit-logs-table-row-${log.id}`}
      id={`audit-logs-table-row-${log.id}`}
      key={`audit-logs-table-row-key-${log.id}`}
      log={log}
    />
  ));

  const noLogs = logs.length === 0 && !isLoading && !hasMore;
  if (noLogs) {
    return <NoAuditLogs />;
  }
  return (
    <Table data-testid="t--audit-logs-table" ref={containerRef}>
      <THead
        className="audit-logs-table-head"
        data-testid="t--audit-logs-table-head"
      >
        <Event data-testid="t--audit-logs-table-head-event-col">
          {createMessage(EVENT_DESCRIPTION_LABEL)}
        </Event>
        <User data-testid="t--audit-logs-table-head-user-col">
          {createMessage(USER_LABEL)}
        </User>
        <Date
          data-testid="t--audit-logs-table-head-date-col"
          onClick={handleDateSortOrderClick}
        >
          <span className="column-header">{createMessage(DATE_LABEL)}</span>
          <Icon
            name="down-arrow-2"
            size={IconSize.LARGE}
            style={{
              color: `#b3b3b3`,
              transform: `rotateZ(${
                dateSortOrder === DATE_SORT_ORDER.DESC ? "0deg" : "180deg"
              })`,
            }}
          />
        </Date>
      </THead>
      <div
        data-testid="t--audit-logs-table-rows-container"
        key={"audit-logs-rows"}
      >
        {rows}
      </div>
      <div
        data-testid="t--audit-logs-table-end-marker"
        id="audit-logs-table-end-marker"
        ref={endMarkerRef}
        style={{ height: "50vh", minHeight: "500px" }}
      >
        {isLoading && <LoadingAuditLogs />}
      </div>
    </Table>
  );
}
