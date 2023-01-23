import React from "react";
import { AuditLogType } from "@appsmith/pages/AuditLogs/types";
import {
  StyledPill,
  StyledPillLabel,
  StyledPillValue,
} from "../styled-components/pill";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAuditLogsLogsInit,
  setOnlyEmailJsonFilter,
  setOnlyEventJsonFilter,
  setResourceIdJsonFilter,
} from "@appsmith/actions/auditLogsAction";
import { Icon, IconSize } from "design-system-old";
import {
  selectAuditLogsLogById,
  selectAuditLogsSearchFilters,
} from "@appsmith/selectors/auditLogsSelectors";
import { getJsonFilterData, JSON_FILTER_KEYS_ENUM } from "../utils/jsonFilter";
import { AppState } from "@appsmith/reducers";
import { toEvent, toUserEmail } from "../utils/toDropdownOption";
import AnalyticsUtil from "utils/AnalyticsUtil";

interface JsonFiltersProps {
  logId: string;
}

/**
 * JsonFilters returns quick (json) filters that are clickable (values) to
 * update the filters and load data instantaneously.
 * @param logId {string}
 * @constructor
 * @returns {JSX.Element}
 */
export default function JsonFilters({ logId }: JsonFiltersProps) {
  const searchFilters = useSelector(selectAuditLogsSearchFilters);
  const currentLog = useSelector((state: AppState) =>
    selectAuditLogsLogById(state, logId),
  );
  const jsonFilterData = getJsonFilterData(currentLog as AuditLogType);

  const dispatch = useDispatch();

  function handleFilterClick(key: string, value: string) {
    switch (key) {
      case JSON_FILTER_KEYS_ENUM.email: {
        const email = toUserEmail(value);
        searchFilters.selectedEmails.push(email);
        dispatch(
          setOnlyEmailJsonFilter({
            email,
          }),
        );

        AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_EMAIL", {
          count: searchFilters.selectedEmails.length,
          source: "JSON_FILTERS",
        });
        break;
      }
      case JSON_FILTER_KEYS_ENUM.event: {
        const event = toEvent(value);
        searchFilters.selectedEvents.push(event);
        dispatch(
          setOnlyEventJsonFilter({
            event,
          }),
        );

        AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_EVENT", {
          count: searchFilters.selectedEvents.length,
          source: "JSON_FILTERS",
        });
        break;
      }
      case JSON_FILTER_KEYS_ENUM["resource.id"]: {
        searchFilters.resourceId = value;
        dispatch(
          setResourceIdJsonFilter({
            resourceId: value,
          }),
        );

        AnalyticsUtil.logEvent("AUDIT_LOGS_FILTER_BY_RESOURCE_ID", {
          length: searchFilters.resourceId.length,
          source: "JSON_FILTERS",
        });
        break;
      }
    }
    /* now fetch the logs */
    dispatch(fetchAuditLogsLogsInit(searchFilters));
  }

  const jsonFilters = jsonFilterData.map(({ key, value }, index) => {
    return (
      <StyledPill
        data-testid="t--audit-logs-json-filter-pill"
        key={`jsonFilterKey-${index}`}
        onClick={() => handleFilterClick(key, value)}
      >
        <StyledPillLabel>
          <Icon
            name={"search"}
            size={IconSize.XL}
            style={{
              display: "inline-block",
              position: "relative",
              top: "4px",
            }}
          />
          <span className="pill-key">{key}</span>
        </StyledPillLabel>
        <StyledPillValue>{value}</StyledPillValue>
      </StyledPill>
    );
  });

  return <div>{jsonFilters}</div>;
}
