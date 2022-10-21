import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { StyledClearAllButton } from "../../styled-components/button";
import {
  fetchAuditLogsLogsInit as fetchLogs,
  resetAuditLogsFilters as resetFilters,
} from "@appsmith/actions/auditLogsAction";
import { selectAuditLogsFiltersDirtyBit as isDirty } from "@appsmith/selectors/auditLogsSelectors";
import { initialAuditLogsFilterState as defaultFilters } from "@appsmith/reducers/auditLogsReducer";
import AnalyticsUtil from "utils/AnalyticsUtil";

export default function Clear() {
  const dispatch = useDispatch();
  const dirty = useSelector(isDirty);

  function handleClear() {
    batch(() => {
      dispatch(resetFilters());
      /* Fetch logs with local data, since dispatch calls are batched */
      dispatch(fetchLogs({ ...defaultFilters }));

      AnalyticsUtil.logEvent("AUDIT_LOGS_CLEAR_FILTERS");
    });
  }

  return dirty ? (
    <StyledClearAllButton
      data-testid="t--audit-logs-filters-clear-all-button"
      onClick={handleClear}
    >
      clear all
    </StyledClearAllButton>
  ) : null;
}
