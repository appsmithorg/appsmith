import React, { useEffect, useState } from "react";
import EmailFilter from "@appsmith/pages/AuditLogs/components/filters/EmailFilter";
import EventFilter from "@appsmith/pages/AuditLogs/components/filters/EventFilter";
import ResourceIdFilter from "@appsmith/pages/AuditLogs/components/filters/ResourceIdFilter";
import DateFilter from "@appsmith/pages/AuditLogs/components/filters/DateFilter";
import Clear from "./Clear";
import { StyledFiltersContainer } from "../../styled-components/container";
import { searchFiltersToUrl } from "../../utils/searchFiltersToUrl";
import { selectAuditLogsSearchFilters } from "@appsmith/selectors/auditLogsSelectors";
import { useSelector } from "react-redux";

export default function Filters() {
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const [url, setUrl] = useState(searchFiltersToUrl(searchFilters));
  useEffect(() => {
    const newUrl = searchFiltersToUrl(searchFilters);
    if (url !== newUrl) {
      setUrl(newUrl);
      window.history.pushState(newUrl, newUrl, newUrl);
    }
  });
  return (
    <StyledFiltersContainer data-testid="t--audit-logs-filters-container">
      <EventFilter />
      <EmailFilter />
      <ResourceIdFilter />
      <DateFilter />
      <Clear />
    </StyledFiltersContainer>
  );
}
