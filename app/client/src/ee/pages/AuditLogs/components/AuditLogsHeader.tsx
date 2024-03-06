import React, { useState } from "react";
import {
  StyledAuditLogsHeader as Header,
  StyledAuditLogsHeading as Heading,
} from "../styled-components/header";
import { refreshAuditLogsInit } from "@appsmith/actions/auditLogsAction";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuditLogsSearchFilters,
  selectAuditLogsIsLoading,
} from "@appsmith/selectors/auditLogsSelectors";
import { StyledHeaderRightContainer as RightSide } from "../styled-components/container";
import {
  createMessage,
  AUDIT_LOGS,
  REFRESH,
} from "@appsmith/constants/messages";
import { downloadDocumentFromURL } from "@appsmith/pages/AuditLogs/utils/downloadDocumentFromURL";
import { downloadAuditLogAPIRoute } from "@appsmith/constants/ApiConstants";
import { payloadToQueryParams as AuditLogFiltersPayload } from "@appsmith/pages/AuditLogs/utils/payloadToQueryParams";
import { convertObjectToQueryParams } from "utils/URLUtils";
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "design-system";
import type { MenuItemProps } from "@appsmith/pages/AdminSettings/AccessControl/types";

/**
 * AuditLogsHeader contains the heading, refresh button and more menu for AuditLogs feature
 * @constructor
 * This depends upon searchFilters and isLoading
 */
export function AuditLogsHeader() {
  const isLoading = useSelector(selectAuditLogsIsLoading);
  const filters = useSelector(selectAuditLogsSearchFilters);
  const dispatch = useDispatch();
  const [showOptions, setShowOptions] = useState(false);
  const pageMenuItems = [
    {
      className: "export-logs-page-menu-item",
      icon: "download-line",
      onSelect: () => handleDownloadLogs(),
      text: "Download",
    },
  ];
  const onOptionSelect = (
    e: React.MouseEvent<Element, MouseEvent>,
    menuItem: MenuItemProps,
  ) => {
    menuItem?.onSelect?.(e);
    setShowOptions(false);
  };

  function handleDownloadLogs() {
    const filtersPayload = AuditLogFiltersPayload({ ...filters, cursor: "" });
    const queryParams = convertObjectToQueryParams(filtersPayload);
    downloadDocumentFromURL(downloadAuditLogAPIRoute(queryParams));
  }

  function handleRefreshButtonClick() {
    dispatch(refreshAuditLogsInit(filters));
  }

  return (
    <Header data-testid="t--audit-logs-header">
      <Heading
        color="var(--ads-v2-color-fg-emphasis-plus)"
        data-testid="t--audit-logs-header-heading"
        kind="heading-l"
        renderAs="h1"
      >
        {createMessage(AUDIT_LOGS)}
      </Heading>
      <RightSide data-testid="t--audit-logs-header-right-side">
        <Button
          aria-disabled={isLoading}
          data-testid="t--audit-logs-header-refresh-button"
          isDisabled={isLoading}
          kind="secondary"
          onClick={handleRefreshButtonClick}
          startIcon={"refresh"}
          type={"reset"}
        >
          {createMessage(REFRESH)}
        </Button>

        <Menu
          onOpenChange={(open: boolean) => {
            setShowOptions(open);
          }}
          open={showOptions}
        >
          <MenuTrigger>
            <Button
              className="actions-icon"
              data-testid="t--page-header-actions"
              isIconButton
              kind="tertiary"
              onClick={() => setShowOptions(!showOptions)}
              size="sm"
              startIcon="more-2-fill"
            />
          </MenuTrigger>
          <MenuContent align="end">
            {pageMenuItems &&
              pageMenuItems.map((menuItem) => (
                <MenuItem
                  className={menuItem.className}
                  key={menuItem.text}
                  onClick={(e: React.MouseEvent) => {
                    onOptionSelect(e, menuItem);
                  }}
                  startIcon={menuItem.icon}
                >
                  {menuItem.text}
                </MenuItem>
              ))}
          </MenuContent>
        </Menu>
      </RightSide>
    </Header>
  );
}
