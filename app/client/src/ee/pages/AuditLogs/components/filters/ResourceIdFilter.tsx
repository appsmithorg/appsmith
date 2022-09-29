import React from "react";
import { TextInput } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAuditLogsLogsInit,
  setResourceIdJsonFilter,
} from "@appsmith/actions/auditLogsAction";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import {
  AUDIT_LOGS_FILTER_HEIGHT,
  AUDIT_LOGS_FILTER_WIDTH,
} from "../../config/audit-logs-config";
import { useGoToTop } from "../../hooks/useGoToTop";
import { StyledLabel as Label } from "../../styled-components/label";
import AnalyticsUtil from "utils/AnalyticsUtil";

export default function ResourceIdFilter() {
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const { resourceId } = searchFilters;
  const dispatch = useDispatch();
  const { goToTop } = useGoToTop();

  function handleChange(value: string) {
    dispatch(setResourceIdJsonFilter({ resourceId: value }));
  }

  function handleBlur() {
    dispatch(fetchAuditLogsLogsInit(searchFilters));
    /* now trigger to-top */
    goToTop();

    AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_RESOURCE_ID", {
      length: searchFilters.resourceId.length,
    });
  }

  return (
    <div>
      <Label>Resource ID</Label>
      <TextInput
        className="audit-logs-filter audit-logs-resource-id-filter"
        data-testid="t--audit-logs-resource-id-filter"
        height={AUDIT_LOGS_FILTER_HEIGHT}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder={"Type or paste resource id"}
        value={resourceId}
        width={AUDIT_LOGS_FILTER_WIDTH}
      />
    </div>
  );
}
