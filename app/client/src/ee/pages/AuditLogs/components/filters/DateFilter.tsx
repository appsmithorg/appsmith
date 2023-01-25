import React from "react";
import { DateRangePicker } from "design-system-old";
import { useDispatch, useSelector } from "react-redux";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import {
  fetchAuditLogsLogsInit,
  setAuditLogsDateFilter,
} from "@appsmith/actions/auditLogsAction";
import { StyledFilterContainer as Container } from "../../styled-components/container";
import { useGoToTop } from "../../hooks/useGoToTop";
import { StyledLabel as Label } from "../../styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";
import moment from "moment/moment";
import { DateRange } from "@blueprintjs/datetime/src/common/dateRange";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";
import { parseDateFilterInput } from "@appsmith/pages/AuditLogs/utils/dateFilter";
import { createMessage } from "design-system-old/build/constants/messages";
import { DATE_RANGE_LABEL } from "@appsmith/constants/messages";

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

  function handleSelection(dateRange: DateRange) {
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
      <Label>{createMessage(DATE_RANGE_LABEL)}</Label>
      <DateRangePicker
        allowSingleDayRange
        data-testid="t--audit-logs-date-filter"
        formatDate={(date) => moment(date).format("DD/M/YY")}
        height={AUDIT_LOGS_FILTER_HEIGHT}
        maxDate={moment()
          .endOf("day")
          .toDate()}
        onChange={handleSelection}
        parseDate={(date) => moment(date, "DD/M/YY").toDate()}
        value={selected}
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </Container>
  );
}
