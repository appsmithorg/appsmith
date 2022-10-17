import React from "react";
import { DateRangePicker } from "design-system";
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
import { initialAuditLogsDateFilter } from "@appsmith/reducers/auditLogsReducer";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";

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

  function handleSelection([inputStartDate, inputEndDate]: DateRange) {
    const startDate =
      inputStartDate !== null
        ? moment(inputStartDate).unix() * 1000
        : initialAuditLogsDateFilter.startDate;
    const endDate =
      inputEndDate !== null
        ? moment(inputEndDate)
            .add(1, "d")
            .subtract(1, "ms")
            .unix() * 1000
        : initialAuditLogsDateFilter.endDate;

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
      <Label>Date Range</Label>
      <DateRangePicker
        allowSingleDayRange
        data-testid="t--audit-logs-date-filter"
        formatDate={(date) => moment(date).format("DD/M/YY")}
        height={AUDIT_LOGS_FILTER_HEIGHT}
        onChange={handleSelection}
        parseDate={(date) => moment(date).toDate()}
        value={selected}
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </Container>
  );
}
