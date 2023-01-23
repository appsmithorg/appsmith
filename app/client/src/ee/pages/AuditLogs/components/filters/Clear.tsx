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
import { createMessage } from "design-system-old/build/constants/messages";
import { CLEAR_ALL } from "@appsmith/constants/messages";

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
      {createMessage(CLEAR_ALL)}
    </StyledClearAllButton>
  ) : null;
}
