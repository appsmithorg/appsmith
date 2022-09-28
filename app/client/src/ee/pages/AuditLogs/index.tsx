import React, { useEffect } from "react";
import AuditLogs from "@appsmith/pages/AuditLogs/components/AuditLogs";
import {
  fetchAuditLogsLogsInit,
  fetchAuditLogsMetadataInit,
  resetAuditLogs,
  setAuditLogsOnUrlLoadFilters,
} from "@appsmith/actions/auditLogsAction";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  DATE_SORT_ORDER,
  initialAuditLogsFilterState,
} from "@appsmith/reducers/auditLogsReducer";
import { DropdownOption } from "design-system";
import { StyledAuditLogsRightPaneContainer as Container } from "./styled-components/container";
import { getCurrentUser, selectFeatureFlags } from "selectors/usersSelectors";
import ErrorPage from "pages/common/ErrorPage";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { urlToSearchFilters } from "./utils/urlToSearchFilters";
import { DATE_FILTER_OPTIONS } from "./utils/jsonFilter";
import { areSearchFiltersDefault } from "./utils/searchFilters";

export default function AuditLogsFeatureContainer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const searchParams: Record<string, DropdownOption[]> = urlToSearchFilters(
      window?.location?.search,
    );
    const filters = {
      emails: searchParams.emails || [],
      events: searchParams.events || [],
      days: (searchParams.days || DATE_FILTER_OPTIONS)[0],
      resourceId: (searchParams.resourceId || [{ value: "" }])[0].value || "",
      sort: (searchParams.sort || [{ value: DATE_SORT_ORDER.DESC }])[0]
        .value as DATE_SORT_ORDER,
    };

    const logFilters = {
      ...initialAuditLogsFilterState,
      selectedEmails: filters.emails,
      selectedEvents: filters.events,
      dateSortOrder: filters.sort,
      resourceId: filters.resourceId,
      days: filters.days,
    };
    const dirty = areSearchFiltersDefault(logFilters);
    batch(() => {
      dispatch(setAuditLogsOnUrlLoadFilters(filters, dirty));
      dispatch(fetchAuditLogsMetadataInit());
      dispatch(fetchAuditLogsLogsInit(logFilters));
    });

    return () => {
      dispatch(resetAuditLogs());
    };
  }, []);

  const user = useSelector(getCurrentUser);
  const features = useSelector(selectFeatureFlags);
  if (!user?.isSuperUser) {
    return <ErrorPage code={ERROR_CODES.REQUEST_NOT_AUTHORISED} />;
  }
  if (!features.AUDIT_LOGS) {
    return <ErrorPage code={ERROR_CODES.PAGE_NOT_FOUND} />;
  }

  return (
    <Container
      data-testid="t--audit-logs-feature-container"
      id="audit-logs-feature-container"
    >
      <AuditLogs />
    </Container>
  );
}
