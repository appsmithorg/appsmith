import React, { useState } from "react";
import {
  StyledAuditLogsHeader as Header,
  StyledAuditLogsHeading as Heading,
} from "../styled-components/header";
import { refreshAuditLogsInit } from "@appsmith/actions/auditLogsAction";
import {
  Button,
  Menu,
  Icon,
  IconSize,
  MenuItem,
  MenuItemProps,
} from "design-system-old";
import { Position } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAuditLogsSearchFilters,
  selectAuditLogsIsLoading,
} from "@appsmith/selectors/auditLogsSelectors";
import { StyledHeaderRightContainer as RightSide } from "../styled-components/container";
import { createMessage } from "design-system-old/build/constants/messages";
import { AUDIT_LOGS, REFRESH } from "@appsmith/constants/messages";
import { downloadDocumentFromURL } from "@appsmith/pages/AuditLogs/utils/downloadDocumentFromURL";
import { downloadAuditLogAPIRoute } from "@appsmith/constants/ApiConstants";
import { payloadToQueryParams as AuditLogFiltersPayload } from "@appsmith/pages/AuditLogs/utils/payloadToQueryParams";
import { convertObjectToQueryParams } from "utils/URLUtils";

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
    menuItem?.onSelect();
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
      <Heading data-testid="t--audit-logs-header-heading">
        {createMessage(AUDIT_LOGS)}
      </Heading>
      <RightSide data-testid="t--audit-logs-header-right-side">
        <Button
          aria-disabled={isLoading}
          category="tertiary"
          data-testid="t--audit-logs-header-refresh-button"
          disabled={isLoading}
          icon={"refresh"}
          iconPosition={"left"}
          onClick={handleRefreshButtonClick}
          text={createMessage(REFRESH)}
          type={"reset"}
        />

        <Menu
          canEscapeKeyClose
          canOutsideClickClose
          className="t--menu-actions-icon"
          isOpen={showOptions}
          menuItemWrapperWidth={"auto"}
          onClose={() => setShowOptions(false)}
          onClosing={() => {
            setShowOptions(false);
          }}
          onOpening={() => setShowOptions(true)}
          position={Position.BOTTOM_RIGHT}
          target={
            <Icon
              className="actions-icon"
              data-testid="t--page-header-actions"
              name="more-2-fill"
              onClick={() => setShowOptions(!showOptions)}
              size={IconSize.XXL}
            />
          }
        >
          {pageMenuItems &&
            pageMenuItems.map((menuItem) => (
              <MenuItem
                className={menuItem.className}
                icon={menuItem.icon}
                key={menuItem.text}
                onSelect={(e: React.MouseEvent) => {
                  onOptionSelect(e, menuItem);
                }}
                text={menuItem.text}
              />
            ))}
        </Menu>
      </RightSide>
    </Header>
  );
}
