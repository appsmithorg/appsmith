import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import {
  fetchAuditLogsLogsInit,
  setAuditLogsDateFilter,
} from "@appsmith/actions/auditLogsAction";
import { StyledFilterContainer as Container } from "../../styled-components/container";
import { useGoToTop } from "../../hooks/useGoToTop";
import AnalyticsUtil from "utils/AnalyticsUtil";
import moment from "moment/moment";
import { parseDateFilterInput } from "@appsmith/pages/AuditLogs/utils/dateFilter";
import { createMessage, DATE_RANGE_LABEL } from "@appsmith/constants/messages";
import { StyledDateRangePicker } from "@appsmith/pages/AuditLogs/styled-components/dateRangePicker";

export default function DateFilter() {
  const dispatch = useDispatch();
  const { goToTop } = useGoToTop();

  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const selected: [Date | null, Date | null] = [
    searchFilters.startDate === 0
      ? null
      : moment.unix(searchFilters.startDate / 1000).toDate(),
    searchFilters.endDate === 0
      ? null
      : moment.unix(searchFilters.endDate / 1000).toDate(),
  ];

  function handleSelection(dateRange: [Date | null, Date | null]) {
    const [startDate, endDate] = parseDateFilterInput(dateRange);
    dispatch(setAuditLogsDateFilter({ startDate, endDate }));
    dispatch(
      fetchAuditLogsLogsInit({
        ...searchFilters,
        startDate,
        endDate,
      }),
    );
    goToTop();

    AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_DATE", {
      startDate,
      endDate,
    });
  }

  return (
    <Container data-testid="t--audit-logs-date-filter-container">
      <StyledDateRangePicker
        allowSameDay
        data-testid="t--audit-logs-date-filter"
        dateFormat="dd/MM/yy"
        endDate={selected[1]}
        inputSize="md"
        label={createMessage(DATE_RANGE_LABEL)}
        maxDate={moment().endOf("day").toDate()}
        onChange={handleSelection}
        showPreviousMonths
        showRangeShortcuts
        size="md"
        startDate={selected[0]}
      />
    </Container>
  );
}
