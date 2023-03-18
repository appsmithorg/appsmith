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
import { StyledAuditLogsRightPaneContainer as Container } from "./styled-components/container";
import { getCurrentUser } from "selectors/usersSelectors";
import ErrorPage from "pages/common/ErrorPage";
import { ERROR_CODES } from "@appsmith/constants/ApiConstants";
import { urlToSearchFilters } from "./utils/urlToSearchFilters";
import { areSearchFiltersDefault } from "./utils/searchFilters";
import {
  toEvent,
  toUserEmail,
} from "@appsmith/pages/AuditLogs/utils/toDropdownOption";
import { getTenantPermissions } from "@appsmith/selectors/tenantSelectors";
import { isPermitted } from "@appsmith/utils/permissionHelpers";
import { PERMISSION_TYPE } from "@appsmith/utils/permissionHelpers";
import { showAdminSettings } from "@appsmith/utils/adminSettingsHelpers";

export default function AuditLogsFeatureContainer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const searchParams = urlToSearchFilters(window?.location?.search);
    const { emails, endDate, events, resourceId, sort, startDate } =
      searchParams;
    const filters = {
      emails: (emails || []).map(toUserEmail),
      events: (events || []).map(toEvent),
      startDate: startDate ? startDate[0] : 0,
      endDate: endDate ? endDate[0] : 0,
      resourceId: resourceId ? resourceId[0] : "",
      sort: sort ? sort[0] : DATE_SORT_ORDER.DESC,
    };

    const logFilters = {
      ...initialAuditLogsFilterState,
      selectedEmails: filters.emails,
      selectedEvents: filters.events,
      dateSortOrder: filters.sort,
      resourceId: filters.resourceId,
      startDate: filters.startDate,
      endDate: filters.endDate,
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
  const tenantPermissions = useSelector(getTenantPermissions);
  const readAuditLogs = isPermitted(
    tenantPermissions,
    PERMISSION_TYPE.READ_AUDIT_LOGS,
  );

  if (!showAdminSettings(user) || !readAuditLogs) {
    return <ErrorPage code={ERROR_CODES.REQUEST_NOT_AUTHORISED} />;
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
