import React from "react";
import {
  StyledAuditLogsHeader as Header,
  StyledAuditLogsHeading as Heading,
} from "../styled-components/header";
import { refreshAuditLogsInit } from "@appsmith/actions/auditLogsAction";
import { Button } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuditLogsSearchFilters,
  selectAuditLogsIsLoading,
} from "@appsmith/selectors/auditLogsSelectors";
import { StyledHeaderRightContainer as RightSide } from "../styled-components/container";

/**
 * AuditLogsHeader contains the heading, refresh button and more menu for AuditLogs feature
 * @constructor
 * This depends upon searchFilters and isLoading
 */
export function AuditLogsHeader() {
  const isLoading = useSelector(selectAuditLogsIsLoading);
  const filters = useSelector(selectAuditLogsSearchFilters);
  const dispatch = useDispatch();

  function handleRefreshButtonClick() {
    dispatch(refreshAuditLogsInit(filters));
  }

  return (
    <Header data-testid="t--audit-logs-header">
      <Heading data-testid="t--audit-logs-header-heading">Audit logs</Heading>
      <RightSide data-testid="t--audit-logs-header-right-side">
        <Button
          aria-disabled={isLoading}
          category="tertiary"
          data-testid="t--audit-logs-header-refresh-button"
          disabled={isLoading}
          icon={"refresh"}
          iconPosition={"left"}
          onClick={handleRefreshButtonClick}
          text={"REFRESH"}
          type={"reset"}
        />
      </RightSide>
    </Header>
  );
}
