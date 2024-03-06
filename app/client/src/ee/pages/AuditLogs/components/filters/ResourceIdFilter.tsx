import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAuditLogsLogsInit,
  setResourceIdJsonFilter,
} from "@appsmith/actions/auditLogsAction";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import { useGoToTop } from "../../hooks/useGoToTop";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  createMessage,
  RESOURCE_ID_LABEL,
  RESOURCE_ID_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { Input } from "design-system";
import { StyledFilterContainer as Container } from "../../styled-components/container";

export default function ResourceIdFilter() {
  const ref = useRef<HTMLInputElement>(null);
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

  function keyDownHandler(e: any) {
    const enter = e.keyCode === 13 || e.key === "Enter" || e.code === "Enter";
    if (ref.current && enter && ref.current.value) {
      handleChange(ref.current.value);
      searchFilters.resourceId = ref.current.value;
      handleBlur();
    }
  }

  useEffect(() => {
    if (ref.current) {
      document.addEventListener("keydown", keyDownHandler);
    }
    return () => document.removeEventListener("keydown", keyDownHandler);
  }, []);

  return (
    <Container data-testid="t--audit-logs-resource-id-filter-container">
      <Input
        className="audit-logs-filter audit-logs-resource-id-filter"
        data-testid="t--audit-logs-resource-id-filter"
        label={createMessage(RESOURCE_ID_LABEL)}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder={createMessage(RESOURCE_ID_PLACEHOLDER)}
        ref={ref}
        renderAs="input"
        size="md"
        value={resourceId}
      />
    </Container>
  );
}
