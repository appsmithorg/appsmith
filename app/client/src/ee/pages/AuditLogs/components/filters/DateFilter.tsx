import React from "react";
import { Dropdown } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import {
  fetchAuditLogsLogsInit,
  setAuditLogsDateFilter,
} from "@appsmith/actions/auditLogsAction";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";
import { toDate } from "../../utils/toDropdownOption";
import { StyledFilterContainer as Container } from "../../styled-components/container";
import { useGoToTop } from "../../hooks/useGoToTop";
import { DATE_FILTER_OPTIONS } from "../../utils/jsonFilter";
import { StyledLabel as Label } from "../../styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";

export default function DateFilter() {
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const selected = searchFilters.days;
  const dispatch = useDispatch();
  const { goToTop } = useGoToTop();
  function handleSelection(value?: string, dropdownOption?: any) {
    const days = dropdownOption || toDate(value || "");
    dispatch(
      setAuditLogsDateFilter({
        days,
      }),
    );
    searchFilters.days = days;
    dispatch(fetchAuditLogsLogsInit(searchFilters));
    goToTop();

    AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_DATE", {
      days: days.value,
    });
  }

  return (
    <Container data-testid="t--audit-logs-date-filter-container">
      <Label>Date</Label>
      <Dropdown
        boundary="viewport"
        className="audit-logs-filter audit-logs-filter-dropdown audit-logs-date-filter-dropdown"
        data-testid="t--audit-logs-date-filter"
        defaultIcon="downArrow"
        height={AUDIT_LOGS_FILTER_HEIGHT}
        onSelect={handleSelection}
        optionWidth={AUDIT_LOGS_FILTER_WIDTH}
        options={DATE_FILTER_OPTIONS}
        selected={selected}
        showLabelOnly
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </Container>
  );
}
